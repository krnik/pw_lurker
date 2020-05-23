import {CommonSchema, BuildSchema} from "./common";
import { AP_REFILL_METOHD } from "../constants";

function buildType (type: string): object {
    return { ...CommonSchema.str, enum: [type] };
}

function buildCondition (properties: object): object {
    const keys = Object.keys(properties).length;
    return {
        properties,
        minProperties: keys === 1 ? 1 : 2,
        maxProperties: Object.keys(properties).length,
        type: 'object',
        required: ['type'],
        additionalProperties: false,
    };
}

export const APRefillConditionSchema = {
    always: buildCondition({
        target: {
            type: 'string',
            enum: [AP_REFILL_METOHD[1], AP_REFILL_METOHD[2]],
        },
        type: buildType('always')
    }),
    count: buildCondition({
        target: {
            type: 'string',
            enum: [AP_REFILL_METOHD[1], AP_REFILL_METOHD[2]],
        },
        type: buildType('count'),
        gt: CommonSchema.uint,
    }),
};

export const ThrowConditionSchema = {
    always: buildCondition({ type: buildType('always') }),
    shiny: buildCondition({ type: buildType('shiny') }),
    starter: buildCondition({ type: buildType('starter') }),
    chance: buildCondition({
        type: buildType('chance'),
        eq: CommonSchema.uint,
        gt: CommonSchema.uint,
        lt: CommonSchema.uint,
        in: BuildSchema.array({ minLength: 1 }, CommonSchema.uint),
    }),
    name: buildCondition({
        type: buildType('name'),
        eq: CommonSchema.str,
        includes: CommonSchema.str,
        in: BuildSchema.array({ minLength: 1 }, CommonSchema.str),
    }),
    level: buildCondition({
        type: buildType('level'),
        eq: CommonSchema.uint,
        gt: CommonSchema.uint,
        lt: CommonSchema.uint,
        in: BuildSchema.array({ minLength: 1 }, CommonSchema.uint),
    }),
    types: buildCondition({
        type: buildType('types'),
        includes: CommonSchema.str,
        some: BuildSchema.array({ minLength: 1 }, CommonSchema.str),
    }),
    itemCount: buildCondition({
        type: buildType('itemCount'),
        eq: CommonSchema.uint,
        gt: CommonSchema.uint,
        lt: CommonSchema.uint,
        in: BuildSchema.array({ minLength: 1 }, CommonSchema.uint),
    }),
    items: buildCondition({
        type: buildType('items'),
        includes: CommonSchema.str,
        some: BuildSchema.array({ minLength: 1 }, CommonSchema.str),
    }),
};

type Always = { type: 'always' };
type Shiny = { type: 'shiny' };
type Starter = { type: 'starter' };
type Chance = {
    type: 'chance',
    eq?: number;
    gt?: number;
    lt?: number;
    in?: number[];
};
type Name = {
    type: 'name';
    eq?: string;
    in?: string[];
    includes?: string;
};
type Level = {
    type: 'level',
    eq?: number;
    gt?: number;
    lt?: number;
    in?: number[];
};
type Types = {
    type: 'types',
    includes?: string,
    some?: string[],
};
type ItemCount = {
    type: 'itemCount',
    eq?: number;
    gt?: number;
    lt?: number;
    in?: number[];
};
type Items = {
    type: 'items';
    includes?: string;
    some?: string[];
};

export type PokeballThrowCondition =
    | Always
    | Starter
    | Shiny
    | Name
    | Chance
    | Level
    | Types
    | ItemCount
    | Items;

export type PokemonMoveCondition =
    | Shiny
    | Name
    | Level;

export const MoveConditionSchema = {
    shiny: ThrowConditionSchema.shiny,
    name: ThrowConditionSchema.name,
    level: ThrowConditionSchema.level,
};

type APAlways = {
    type: 'always',
    target: (typeof AP_REFILL_METOHD[1] | typeof AP_REFILL_METOHD[2])
};

type APCount = {
    type: 'count',
    target: (typeof AP_REFILL_METOHD[1] | typeof AP_REFILL_METOHD[2])
    gt: number,
};

export type APRefillCondition = APAlways | APCount;
