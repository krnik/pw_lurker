import type { Config } from '../core/types';
import {Browser, Page } from 'puppeteer';
import {props} from '../core/utils.js';
import {Cache} from './cache.js';
import { logger } from './utils/logger.js';


export interface BotPage extends Page {
    logger: typeof logger,
};

export async function getBotPage (browser: Browser, config: Config.Core): Promise<BotPage> {
    const pages = await browser.pages();
    const page: BotPage = (pages[0] || await browser.newPage()) as BotPage;
    page.logger = logger.child({ acc: config['user.login'] });

    await page.setRequestInterception(true);

    page.on('request', async (request) => {
        const url = request.url();

        if (url.includes('chat.js')) {
            return await request.abort('blockedbyclient');
        }

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

    await page.goto('https://pokewars.pl');

    const { 'user.login': login, 'user.password': password } = props(config, ['user.login', 'user.password']);

    await page.type('[name=login]', login);
    await page.type('[name=pass]', password);
    await Promise.all([
        page.click('[name=zaloguj]'),
        page.waitForNavigation(),
    ]);

    return page;
}

