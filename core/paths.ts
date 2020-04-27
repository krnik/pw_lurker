import { resolve } from 'path';
import {readdirSync, statSync} from 'fs';

const root = (() => {
    let currentPath = resolve(__dirname);
    while (true) {
        if (statSync(currentPath).isDirectory() && readdirSync(currentPath).includes('package.json')) {
            return currentPath;
        }
        currentPath = resolve(currentPath, '../');
    }
})();

export function resolveRoot (chunks: string[]): string {
    return resolve(root, ...chunks);
}
