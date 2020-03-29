import type { Page, Option, Config } from '../core/types';
import {Browser, Page as PuppeteerPage} from 'puppeteer';
import {some, props} from '../core/utils.js';
import {Cache} from './cache.js';
import { logger } from './utils/logger.js';

type Elem = Page.Handle;
type BasePage = PuppeteerPage & Page.Core<Elem>;

export interface BotPage extends BasePage {
    logger: typeof logger,
};

async function getElem (this: BotPage, selector: string): Promise<Elem> {
    this.logger.debug({ selector, msg: 'Page.getElem' });
    return await this.$(selector).then(some);
}

async function getElems (this: BotPage, selector: string): Promise<Elem[]> {
    this.logger.debug({ selector, msg: 'Page.getElems' });
    return await this.$$(selector);
}

async function getAttr (this: BotPage, selector: string, attrName: string): Promise<Option<string>> {
    this.logger.debug({ selector, attrName, msg: 'Page.getAttr' });
    const elem = await this.getElem(selector);
    return await elem.evaluate((self, name) => self.getAttribute(name), attrName);
}

async function getAttrs (this: BotPage, selector: string, attrName: string): Promise<Option<string>[]> {
    this.logger.debug({ selector, attrName, msg: 'Page.getAttrs' });
    const elems = await this.getElems(selector);
    return await Promise.all(elems.map((elem) => elem.evaluate((self, name) => self.getAttribute(name), attrName)));
}

async function getText (this: BotPage, selector: string): Promise<string> {
    this.logger.debug({ selector, msg: 'Page.getText' });
    const elem = await this.getElem(selector);
    return some(await elem.evaluate((self) => self.textContent));
}

async function currentUrl (this: BotPage): Promise<string> {
    this.logger.debug({ msg: 'Page.currentUrl' });
    return await this.evaluate(() => window.location.href).then(some);
}

async function ensurePath(this: BotPage, path: string): Promise<void> {
    this.logger.debug({ path, msg: 'Page.ensurePath' });
    const currentUrl = await this.currentUrl();
    const url = `https://gra.pokewars.pl/${path}`;

    if (currentUrl === url) return;

    await this.goto(url);
}

async function submitNavigate (this: BotPage, formName: string): Promise<void> {
    this.logger.debug({ formName, msg: 'Page.submit' });
    await Promise.all([
        this.waitForNavigation({ waitUntil: ['load'] }),
        this.evaluate(`${formName}.submit()`),
    ]);
}

async function clickNavigate (this: BotPage, selector: string): Promise<void> {
    this.logger.debug({ selector, msg: 'Page.clickNavigate' });
    await Promise.all([
        this.waitForNavigation({ waitUntil: ['load'] }).catch((error) => {
            this.logger.error({
                ...error,
                msg: 'WaitForNavigation Error',
            });
            throw error;
        }),
        this.click(selector),
    ]);
}

export async function getBotPage (browser: Browser, config: Config.Core): Promise<BotPage> {
    type ImplDescriptors = {
        [K in Exclude<keyof BotPage, keyof PuppeteerPage>]: { value: BotPage[K] };
    };

    const pages = await browser.pages();
    const proto = pages[0] || await browser.newPage();
    await proto.setRequestInterception(true);

    const accLogger = logger.child({ acc: config['user.login'] });

    const customImpls: ImplDescriptors = {
        currentUrl: { value: currentUrl },
        ensurePath: { value: ensurePath },
        getText: { value: getText },
        getElem: { value: getElem },
        getElems: { value: getElems },
        getAttr: { value: getAttr },
        getAttrs: { value: getAttrs },
        submitNavigate: { value: submitNavigate },
        clickNavigate: { value: clickNavigate },
        logger: { value: accLogger },
    };

    const page: BotPage = Object.create(proto, customImpls);

    page.on('request', async (request) => {
        const url = request.url();

        if (url.includes('general.js')) {
            return await request.respond({
                status: 200,
                contentType: 'application/javascript',
                body: Cache.getStatic('general.js'),
            });
        }

        return Cache.has(url)
            ? await request.respond({ status: 200, body: await Cache.get(url) })
            : await request.continue();
    });

    page.on('response', (response) => Cache.set(response));

    await page.goto('https://pokewars.pl', { waitUntil: ['load'] });

    const { 'user.login': login, 'user.password': password } = props(config, ['user.login', 'user.password']);

    await page.type('[name=login]', login);
    await page.type('[name=pass]', password);
    await page.clickNavigate('[name=zaloguj]');

    return page;
}

