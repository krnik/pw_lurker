import { POKEBALLS, POKEBALL_CONDITION, AP_REFILL_METOHD, HEAL_METHOD } from "./constants";

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
    UINT: {
        type: 'number',
        minimum: 1,
        multipleOf: 1,
    },
};

const pokeballThrowConditionSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['type'],
    properties: {
        type: CHUNK.POKEBALL_CONDITION,
        value: {
            oneOf: [
                CHUNK.STRING,
                CHUNK.UINT,
            ]
        },
    },
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
        'hunt.pokeballs': {
            type: 'array',
            minLength: 1,
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['pokeball', 'when'],
                properties: {
                    pokeball: CHUNK.POKEBALL,
                    when: {
                        type: 'array',
                        minLength: 1,
                        items: pokeballThrowConditionSchema,
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
    type: 'array',
    minLength: 1,
    items: accountSchema,
};
