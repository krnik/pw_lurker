import type { Page, Option, Config } from '../core/types';
import {Browser, Page as PuppeteerPage} from 'puppeteer';
import {configuration} from './configuration.js';
import {some} from '../core/utils.js';
import {Cache} from './cache.js';

type Elem = Page.Handle;
type BasePage = PuppeteerPage & Page.Core<Elem>;

export interface BotPage extends BasePage {
    __config: Config.Core;
};

async function getElem (this: BotPage, selector: string): Promise<Elem> {
    return await this.$(selector).then(some);
}

async function getAttr (this: BotPage, selector: string, attrName: string): Promise<Option<string>> {
    const elem = await this.getElem(selector);
    return await elem.evaluate((self, name) => self.getAttribute(name), attrName);
}

async function getAttrs (this: BotPage, selector: string, attrName: string): Promise<Option<string>[]> {
    const elems = await this.$$(selector);
    return await Promise.all(elems.map((elem) => elem.evaluate((self, name) => self.getAttribute(name), attrName)));
}

async function getText (this: BotPage, selector: string): Promise<string> {
    const elem = await this.getElem(selector);
    return some(await elem.evaluate((self) => self.textContent));
}

async function currentUrl (this: BotPage): Promise<string> {
    return await this.evaluate(() => window.location.href).then(some);
}


async function ensurePath(this: BotPage, path: string): Promise<void> {
    const currentUrl = await this.currentUrl();
    const url = `https://gra.pokewars.pl/${path}`;

    if (currentUrl === url) return;

    await this.goto(url);
}

async function clickNavigate (this: BotPage, selector: string): Promise<void> {
    await Promise.all([
        this.waitForNavigation(),
        this.click(selector),
    ]);
}


export async function getBotPages (browser: Browser): Promise<BotPage[]> {
    type ImplDescriptors = {
        [K in Exclude<keyof BotPage, keyof PuppeteerPage>]: { value: BotPage[K] };
    };

    const pages = await browser.pages();

    return Promise.all(configuration.accounts.map(async (config, index) => {
        const proto = pages[index] || await browser.newPage();
        await proto.setRequestInterception(true);

        const customImpls: ImplDescriptors = {
            currentUrl: { value: currentUrl },
            ensurePath: { value: ensurePath },
            getText: { value: getText },
            getElem: { value: getElem },
            getAttr: { value: getAttr },
            getAttrs: { value: getAttrs },
            clickNavigate: { value: clickNavigate },
            __config: { value: config },
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

        return page;
    }));
}

