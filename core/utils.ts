import type {Option, None} from "./types";

export function unreachable (): never {
    throw new Error('Unreachable');
}

export const is = {
    num <T>(value: T): number {
        if (typeof value === 'number') return value;

        const message = `Expected value: ${value} to be of type "number"`;
        throw new Error(message);
    },

    none <T>(value: Option<T>): value is None {
        return value == null;
    },
};

export function props<T, K extends keyof T> (source: T, keys: K[]): Record<K, T[K]> {
    const values: Record<K, T[K]> = {} as any;

    for (const key of keys) {
        values[key] = source[key];
    }
    
    return values;
}

export function some<T> (value: T): Exclude<T, null | undefined> {
    if (value == null) {
        throw new Error('Value cannot be null or undefined');
    }
    return value as Exclude<T, null | undefined>;
}

