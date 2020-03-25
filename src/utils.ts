import type {Option, OrPromise} from "./types";
import { ElementHandle } from "puppeteer";

export function unreachable (): never {
    throw new Error('Unreachable');
}

export async function chain<
    F extends (...args: any[]) => OrPromise<void>,
    A extends Parameters<F>
> (functions: F[], args: A): Promise<void> {
    for (const fn of functions) {
        await fn(...args);
    }
}

export function some<T> (value: T): Exclude<T, null | undefined> {
    if (value == null) {
        throw new Error('Value cannot be null or undefined');
    }
    return value as Exclude<T, null | undefined>;
}

export function toNumber (numeric: Option<string | number>): number {
    const result = Number(some(numeric));

    if (result !== result) {
        const message = `Attempt to convert ${numeric} to number failed.`;
        throw new Error(message);
    }

    return result;
}

export function toMoneyAmount (balance: Option<string>): number {
    const digits = /^\d+/.exec(some(balance).replace('.', '').trim());
    return toNumber(some(digits)[0]);
}

export async function show (elem: ElementHandle<Element>, fn: () => Promise<void>): Promise<void> {
    await elem.evaluate((e) => e.classList.add('next_action'));
    await fn();
    await elem.evaluate((e) => e.classList.remove('next_action'));
}

export function sleep (ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}
