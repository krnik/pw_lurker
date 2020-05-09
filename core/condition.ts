import {CONDITION_KEYWORD} from "./constants";

type ConditionKey = (typeof CONDITION_KEYWORD)[number];
type Condition = Partial<Record<Exclude<ConditionKey, 'type'>, unknown>>;

const COMPARISON: Record<ConditionKey, (left: any, right: any) => boolean> = {
    startsWith (left: string, right: string): boolean {
        return left.startsWith(right);
    },
    includes (left: string | any[], right: any): boolean {
        return left.includes(right);
    },
    in (left: any, right: any[]): boolean {
        return right.includes(left);
    },
    gt (left: number, right: number): boolean {
        return left > right;
    },
    lt (left: number, right: number): boolean {
        return left < right;
    },
    eq (left: any, right: any): boolean {
        return left === right;
    },
    some (left: any[], right: any[]): boolean {
        return left.some((elem) => right.includes(elem));
    },
};

export function evaluateCondition (condition: Condition, left: any): boolean {
    return Object.keys(condition)
        .filter((key) => key in COMPARISON)
        .every((key) => COMPARISON[key as ConditionKey](left, condition[key as ConditionKey]));
}

