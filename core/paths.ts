import { resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(fileURLToPath(import.meta.url), '..');

export function resolveRoot (chunks: string[]): string {
    return resolve(root, ...chunks);
}
