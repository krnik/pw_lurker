import type {Option, Some, None} from "./types";
import { ElementHandle } from "puppeteer";

export function unreachable (): never {
    throw new Error('Unreachable');
}

export const is = {
    str <T>(value: T): string {
        if (typeof value === 'string') return value;

        const message = `Expected value: ${value} to be of type "string"`;
        throw new Error(message);
    },

    num <T>(value: T): number {
        if (typeof value === 'number') return value;

        const message = `Expected value: ${value} to be of type "number"`;
        throw new Error(message);
    },

    some <T>(value: Option<T>): value is Some<T> {
        return value != null;
    },

    none <T>(value: Option<T>): value is None {
        return value == null;
    },
};

export function combine<
    F1 extends (...args: any[]) => any,
    F2 extends (...args: ReturnType<F1>[]) => any,
> (f1: F1, f2: F2): (...args: Parameters<F1>) => ReturnType<F2> {
    return (...args: Parameters<F1>) => {
        return f2(f1(...args));
    };

}

export function props<T, K extends keyof T> (source: T, keys: K[]): T[K][] {
    const values: T[K][] = [];

    for (const key of keys) {
        values.push(source[key]);
    }
    
    return values;
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

