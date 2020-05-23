import {BuildSchema, CommonSchema} from "./schema/common";
import {MoveConditionSchema, ThrowConditionSchema, APRefillConditionSchema} from "./schema/condition";
import {SchemaEnum} from "./schema/enums";
import { AP_REFILL_METOHD } from "./constants";

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
        'user.login': CommonSchema.str,
        'user.password': CommonSchema.str,
        'bot.workWhileWaiting': { type: 'boolean' },
        'hunt.locationAPCost': {
            ...CommonSchema.uint,
            minimum: 4,
            maximum: 8,
        },
        'hunt.location': CommonSchema.str,
        'hunt.noAP': BuildSchema.array(
            { minLength: 1 }, 
            BuildSchema.oneOf(
                { type: 'string', const: AP_REFILL_METOHD[0] },
                BuildSchema.oneOf(APRefillConditionSchema.always, APRefillConditionSchema.count)
            ),
        ),
        'hunt.pokemonPokeboxStore': {
            type: 'array',
            items: BuildSchema.oneOf(
                MoveConditionSchema.name,
                MoveConditionSchema.shiny,
                MoveConditionSchema.level,
            ),
        },
        'hunt.pokeballs': BuildSchema.array({ minLength: 1 }, {
            type: 'object',
            required: ['pokeballs', 'when', 'best'],
            additionalProperties: false,
            properties: {
                pokeballs: BuildSchema.array({ minLength: 1 }, SchemaEnum.pokeball),
                when: BuildSchema.array({ minLength: 1 }, BuildSchema.oneOf(
                    ThrowConditionSchema.always,
                    ThrowConditionSchema.chance,
                    ThrowConditionSchema.itemCount,
                    ThrowConditionSchema.items,
                    ThrowConditionSchema.level,
                    ThrowConditionSchema.name,
                    ThrowConditionSchema.shiny,
                    ThrowConditionSchema.starter,
                    ThrowConditionSchema.types,
                )),
                best: {
                    type: 'string',
                    enum: ['chance', 'quantity'],
                },
            },
        }),
        'leader.minHealth': {
            ...CommonSchema.uint,
            minimum: 1,
        },
        'leader.healMethod': BuildSchema.array({ minLength: 1 }, SchemaEnum.healMethod),
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
