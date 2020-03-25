import type { ElementHandle, Page as CorePage, Browser } from 'puppeteer';
import type { Config, OrPromise } from './types';
import { readFileSync } from "fs";
import { resolve } from "path";
import * as Ajv from "../node_modules/ajv/lib/ajv.js";
import {some} from './utils.js';
import { Cache } from './cache.js';
import * as Pino from 'pino';

const logger: ReturnType<typeof Pino> = (Pino as any).default();
logger.level = 'trace';

const ajv: ReturnType<typeof Ajv> = new (Ajv as any).default;

const configs: Config[] = (() => {
    const path = resolve(process.cwd(), 'config.json');
    const schemaPath = resolve(process.cwd(), 'config.schema.json');
    const jsonConfig: { accounts: Config[] } = JSON.parse(readFileSync(path).toString());
    const schema = ajv.compile(JSON.parse(readFileSync(schemaPath).toString()));

    if (!schema(jsonConfig)) {
        logger.error({ msg: 'Invalid config', errors: schema.errors });
        throw new Error('Invalid Schema');
    }
    
    return jsonConfig.accounts;
})();


export interface Page extends CorePage {
    readonly _config: Config;
    getElem: (this: Page, selector: string) => Promise<ElementHandle<Element>>;
    getElemOr: <R>(this: Page, selector: string, orFn: () => R) => Promise<ElementHandle<Element> | R>;
    getText: (this: Page, selector: string) => Promise<string>;
    getTextOr: (this: Page, selector: string, orFn: () => OrPromise<string>) => Promise<string>;
    config: <K extends keyof Config>(this: Page, property: K) => Config[K];
    getCurrentUrl: (this: Page) => Promise<string>;
    ensurePath: (this: Page, path: string) => Promise<void>;
    clickAndWait: (this: Page, selector: string) => Promise<void>;
    logger: typeof logger;
}

function getElem (this: Page, selector: string): Promise<ElementHandle<Element>> {
    return this.$(selector).then(some);
}

function getElemOr <R>(this: Page, selector: string, orFn: () => R): Promise<ElementHandle<Element> | R> {
    return this.$(selector).then((elem) => elem || orFn());
}

function getText (this: Page, selector: string): Promise<string> {
    return this.$(selector)
        .then(some)
        .then((elem) => elem.evaluate((e) => e.textContent))
        .then(some);
}

function getTextOr (this: Page, selector: string, orFn: () => OrPromise<string>): Promise<string> {
    return this.$(selector)
        .then(some)
        .then((elem) => elem.evaluate((e) => e.textContent))
        .then((text) => text || orFn());
}

function getConfig <K extends keyof Config>(this: Page, property: K): Config[K] {
    return this._config[property];
}

function getCurrentUrl (this: Page): Promise<string> {
    return this.evaluate(() => window.location.href).then(some);
}


async function ensurePath(this: Page, path: string): Promise<void> {
    const currentUrl = await this.getCurrentUrl();
    const url = `https://gra.pokewars.pl/${path}`;

    if (currentUrl === url) return;

    await this.goto(url);
}

async function clickAndWait (this: Page, selector: string): Promise<void> {
    await Promise.all([
        this.waitForNavigation(),
        this.click(selector),
    ]);
}

export async function getPages (browser: Browser): Promise<Page[]> {
    const pages = await browser.pages() as unknown[] as Page[];
    
    return await Promise.all(configs.map(async (config, i) => {
        const bPage = pages[i] || await browser.newPage();
        const page: Page = Object.create(bPage, {
            getElem: { value: getElem },
            getElemOr: { value: getElemOr },
            getText: { value: getText },
            getTextOr: { value: getTextOr },
            getCurrentUrl: { value: getCurrentUrl },
            ensurePath: { value: ensurePath },
            config: { value: getConfig },
            clickAndWait: { value: clickAndWait },
            _config: { value: config },
            logger: { value: logger.child({ acc: config['user.login'] }) },
        });

        await page.setRequestInterception(true);

        page.on('request', async (req) => {
            const url = req.url();
            if (url.includes('general.js')) {
                return await req.respond({
                    status: 200,
                    contentType: 'application/javascript',
                    body: Cache.getStatic('general.js'),
                });
            }

            return Cache.has(url)
                ? await req.respond({ status: 200, body: await Cache.get(url) })
                : await req.continue();
        });

        page.on('response', async (res) => Cache.set(res));

        return page;
    }));
}

