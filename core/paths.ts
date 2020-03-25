import { resolve } from 'path';

const root = resolve(process.cwd());

export function resolveRoot (chunks: string[]): string {
    return resolve(root, ...chunks);
}
