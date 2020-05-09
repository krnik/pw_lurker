import { POKEBALLS, AP_REFILL_METOHD, HEAL_METHOD } from "../constants";

const pokeball = {
    type: 'string',
    enum: POKEBALLS.ALL,
};

const apRefillMethod = {
    type: 'string',
    enum: AP_REFILL_METOHD,
};

const healMethod = {
    type: 'string',
    enum: HEAL_METHOD,
};

export const SchemaEnum = {
    pokeball,
    apRefillMethod,
    healMethod,
};
