// @ts-ignore
import puppeteer from 'puppeteer';
import type * as P from 'puppeteer';
import {Bot} from './bot.js';
import {getPages} from './page.js';

const p: typeof P = puppeteer;

async function start () {
    const browser = await p.launch({
        headless: process.env.PW_BOT_HEADLESS === 'true',
        devtools: true,
        defaultViewport: { width: 1200, height: 650 }
    });

    for (const page of await getPages(browser)) {
        page.goto('https://pokewars.pl')
            .then(() => {
                new Bot(page).act();
            });
    }
}

start();
