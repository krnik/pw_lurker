import { resolve } from 'path';
import {readdirSync, readFile, writeFile, readFileSync} from 'fs';
import type {Response} from 'puppeteer';
import { some } from '../core/utils.js';
import { CACHE_DIR_NAME, STATIC_DIR_NAME } from '../core/constants.js';
import { logger } from './utils/logger.js';

class CacheBase {
    static REGEX: RegExp = /^https?:\/\/(gra\.)?pokewars.pl\/(?<route>.+)(\?[\w\W]*)?$/i;
    static MIMES: RegExp[] = [/^image\/\w+$/];
    static CACHE_PATH = resolve(process.cwd(), CACHE_DIR_NAME);
    static STATIC_PATH = resolve(process.cwd(), STATIC_DIR_NAME);
    static logger = logger;
    static ignored: Set<string> = new Set();
    static ignoredList: string[] = [];

    static ignore (url: string) {
        this.ignored.add(url);
        this.ignoredList.push(url);

        if (this.ignoredList.length > 400) {
            setTimeout(() => {
                while (this.ignoredList.length > 400) {
                    const entry = this.ignoredList.shift();

                    if (entry !== undefined) {
                        this.ignored.delete(entry);
                    }
                }
            }, 1);
        }
    }

    static shouldCache (res: Response): boolean {
        const url = res.url();
        if (this.ignored.has(url)) {
            return false;
        }

        const contentType = res.headers()['content-type'];
        const shouldCache = this.urlValid(url)
            && this.MIMES.some((mime) => mime.test(contentType));

        if (!shouldCache) {
            this.ignore(url);
        }

        return shouldCache;
    }

    static urlValid (url: string): boolean {
        return this.REGEX.test(url);
    }

    static fileName (url: string): string {
        const name = some(some(this.REGEX.exec(url)).groups).route;
        return encodeURIComponent(name);
    }

    items: Set<string>;
    staticItems: Map<string, Buffer>;

    constructor () {
        this.items = new Set(readdirSync(CacheBase.CACHE_PATH));
        this.staticItems = new Map();

        const staticFiles = readdirSync(CacheBase.STATIC_PATH);
        for (const file of staticFiles) {
            this.staticItems.set(file, readFileSync(resolve(CacheBase.STATIC_PATH, file)));
        }
    }

    has (url: string): boolean {
        return CacheBase.urlValid(url) 
            && this.items.has(CacheBase.fileName(url));
    }

    get (url: string): Promise<Buffer> {
        const name = CacheBase.fileName(url);
        const path = resolve(CacheBase.CACHE_PATH, name);

        if (!this.items.has(name)) {
            const message = `No file ${url} in cache.`;
            throw new Error(message);
        }

        return new Promise((resolve, reject) => {
            readFile(path, (err, data) => err ? reject(err) : resolve(data));
        });
    }

    async set (response: Response): Promise<void> {
        if (!CacheBase.shouldCache(response)) {
            return;
        }

        const path = CacheBase.fileName(response.url());

        if (this.items.has(path)) {
            return;
        }

        this.items.add(path);
        await new Promise(async (res, rej) => {
            writeFile(resolve(CacheBase.CACHE_PATH, path), await response.buffer(), (err) => err ? rej(err) : res());
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
