import { resolve } from 'path';
import {existsSync, mkdirSync, statSync, unlinkSync, readdirSync, readFile, writeFile, readFileSync} from 'fs';
import type {Response} from 'puppeteer';
import { some } from './utils.js';
import * as Pino from 'pino';

function ensureDirectory (path: string): string {
    if (!existsSync(path)) {
        mkdirSync(path);
    } else {
        const info = statSync(path);
        if (!info.isDirectory()) {
            unlinkSync(path);
            mkdirSync(path);
        }
    }

    return path;
}

const CACHE_DIR_PATH = ensureDirectory(resolve(process.cwd(),  '.pw_bot_cache'));
const STATIC_DIR_PATH = resolve(process.cwd(), 'static');

class CacheBase {
    static REGEX: RegExp = /^https?:\/\/(gra\.)?pokewars.pl\/(?<route>.+)(\?[\w\W]*)?$/i;
    static MIMES: RegExp[] = [/^image\/\w+$/];
    static logger: ReturnType<typeof Pino> = (Pino as any).default();
    static ignored: Set<string> = new Set();
    static ignoredList: string[] = [];

    static ignore (url: string) {
        this.ignored.add(url);
        this.ignoredList.push(url);

        if (this.ignoredList.length > 400) {
            setTimeout(() => {
                while (this.ignoredList.length > 400) {
                    const entry = this.ignoredList.shift();
                    this.logger.trace({
                        entry,
                        msg: 'Removing cached ignore entry',
                    });
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

        this.logger.trace({
            msg: 'Should cache',
            contentType,
            url,
            shouldCache,
        });

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

    path: string;
    items: Set<string>;
    staticItems: Map<string, Buffer>;

    constructor (path: string) {
        this.path = path;
        this.items = new Set(readdirSync(path));
        this.staticItems = new Map();

        const staticFiles = readdirSync(STATIC_DIR_PATH);
        for (const file of staticFiles) {
            this.staticItems.set(file, readFileSync(resolve(STATIC_DIR_PATH, file)));
        }
    }

    has (url: string): boolean {
        return CacheBase.urlValid(url) 
            && this.items.has(CacheBase.fileName(url));
    }

    get (url: string): Promise<Buffer> {
        const name = CacheBase.fileName(url);
        const path = resolve(CACHE_DIR_PATH, name);

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
            writeFile(resolve(this.path, path), await response.buffer(), (err) => err ? rej(err) : res());
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

CacheBase.logger.level = 'trace';

export const Cache = new CacheBase(CACHE_DIR_PATH);
