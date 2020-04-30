import { POKEBALLS, POKEBALL_CONDITION, AP_REFILL_METOHD, HEAL_METHOD, POKEMON_POKEBOX_CONDITION, CONDITION_KEYWORD } from "./constants";
import {Config} from "./types";

const CHUNK = {
    POKEBALL: {
        type: 'string',
        enum: POKEBALLS.ALL,
    },
    POKEBALL_CONDITION: {
        type: 'string',
        enum: POKEBALL_CONDITION,
    },
    AP_REFILL: {
        type: 'string',
        enum: AP_REFILL_METOHD,
    },
    HEAL_METHOD: {
        type: 'string',
        enum: HEAL_METHOD,
    },
    STRING: {
        type: 'string',
        minLength: 1,
    },
    BOOLEAN: {
        type: 'boolean',
    },
    AP_COST: {
        type: 'number',
        minimum: 4,
        maximum: 8,
        multipleOf: 1,
    },
    POKEMON_POKEBOX_STORE_CONDITION: {
        type: 'string',
        enum: POKEMON_POKEBOX_CONDITION,
    },
    CONDITION_KEYWORD: {
        type: 'string',
        enum: CONDITION_KEYWORD,
    },
    UINT: {
        type: 'number',
        minimum: 1,
        multipleOf: 1,
    },
    NUMBER: {
        type: 'number',
    },
};

const conditionSchema = {
    type: 'object',
    required: ['type'],
    additionalProperties: false,
    properties: ({
        type: CHUNK.STRING,
        lt: CHUNK.NUMBER,
        gt: CHUNK.NUMBER,
        eq: { oneOf: [CHUNK.NUMBER, CHUNK.STRING] },
        includes: { oneOf: [CHUNK.NUMBER, CHUNK.STRING] },
        startsWith: CHUNK.STRING,
        in: { type: 'array', items: { oneOf: [CHUNK.NUMBER, CHUNK.STRING] } },
    } as Record<Config.ConditionKey, object>),
};

const accountSchema = {
    type: 'object',
    additionalProperties: false,
    required: [
        'user.login',
        'user.password',
        'bot.workWhileWaiting',
        'hunt.locationAPCost',
        'hunt.location',
        'hunt.noAP',
        'hunt.pokeballs',
        'hunt.pokemonPokeboxStore',
        'leader.minHealth',
        'leader.healMethod',
    ],
    properties: {
        'user.login': CHUNK.STRING,
        'user.password': CHUNK.STRING,
        'bot.workWhileWaiting': CHUNK.BOOLEAN,
        'hunt.locationAPCost': CHUNK.AP_COST,
        'hunt.location': CHUNK.STRING,
        'hunt.noAP': {
            type: 'array',
            minLength: 1,
            items: CHUNK.AP_REFILL,
        },
        'hunt.pokemonPokeboxStore': {
            type: 'array',
            items: conditionSchema,
        },
        'hunt.pokeballs': {
            type: 'array',
            minLength: 1,
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['pokeballs', 'when', 'best'],
                properties: {
                    pokeballs: {
                        type: 'array',
                        minLength: 1,
                        items: CHUNK.POKEBALL,
                    },
                    when: {
                        type: 'array',
                        minLength: 1,
                        items: conditionSchema,
                    },
                    best: {
                        type: 'string',
                        enum: ['chance', 'quantity'],
                    },
                },
            },
        },
        'leader.minHealth': {
            type: 'number',
            minimum: 1,
        },
        'leader.healMethod': {
            type: 'array',
            minLength: 1,
            items: CHUNK.HEAL_METHOD,
        },
    },
};

export const configSchema = {
    type: 'object',
    required: ['accounts'],
    properties: {
        accounts: {
            type: 'array',
            minLength: 1,
            items: accountSchema,
        },
    },
};
