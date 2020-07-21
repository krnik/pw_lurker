import {readdirSync, readFile, writeFile, readFileSync, existsSync, mkdirSync} from 'fs';
import type {Response} from 'puppeteer';
import { CACHE_DIR_NAME, STATIC_DIR_NAME } from '../core/constants.js';
import {resolveRoot} from '../core/paths.js';
import {createHash} from 'crypto';

class CacheBase {
    static chacheResponsePredicates: ((r: Response) => boolean)[] = [
        (r) => r.url().includes('pokewars.pl/img'),
        (r) => r.url().includes('pokewars.pl/fonts'),
        (r) => r.url().includes('pokewars.pl/css'),
        (r) => r.url().includes('pokewars.pl/js/libs'),
        (r) => r.url().includes('jsdelivr.net'),
        (r) => r.url().includes('googleapis.com'),
    ];

    items: Set<string>;
    staticItems: Map<string, Buffer>;

    constructor () {
        if (!existsSync(CACHE_DIR_NAME)) {
            mkdirSync(CACHE_DIR_NAME);
        }

        this.items = new Set(readdirSync(resolveRoot([CACHE_DIR_NAME])));

        this.staticItems = new Map();

        const original = readFileSync(resolveRoot([STATIC_DIR_NAME, 'general.js']));
        const inject = readFileSync(resolveRoot(['dist/inject.js']));

        this.staticItems.set('general.js', Buffer.from(
            original.toString() + '\n' + inject.toString()
        ));
    }

    urlToHash (url: string): string {
        return createHash('sha256').update(url).digest('hex');
    }

    has (url: string): boolean {
        return this.items.has(this.urlToHash(url));
    }

    get (url: string): Promise<Buffer> {
        const hash = this.urlToHash(url);

        if (!this.items.has(hash)) {
            const message = `No file ${url} in cache.`;
            throw new Error(message);
        }

        return new Promise((resolve, reject) => {
            readFile(resolveRoot([CACHE_DIR_NAME, hash]), (err, data) => err ? reject(err) : resolve(data));
        });
    }

    async set (response: Response): Promise<void> {
        if (!CacheBase.chacheResponsePredicates.some((fn) => fn(response))) {
            return;
        }

        const hash = this.urlToHash(response.url());
        if (this.items.has(hash)) {
            return;
        }

        this.items.add(hash);

        await new Promise(async (res, rej) => {
            writeFile(resolveRoot([CACHE_DIR_NAME, hash]), await response.buffer(), (err) => err ? rej(err) : res());
        });
    }
    
    getStatic (name: string): Buffer {
        if (!this.staticItems.has(name)) {
            const message = `No file ${name} in static items.`;
            throw new Error(message);
        }

        return this.staticItems.get(name)!;
    }
}

export const Cache = new CacheBase();
