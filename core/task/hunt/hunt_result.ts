import type {App} from "../../types";
import {HUNT_RESULT} from "../../constants.js";

async function isPokemonEncounter (app: App.Core): Promise<boolean> {
    return await app.extern.evaluateResult(() => window.many('.loc-poke').map((elems) => elems.length > 0));
}

async function isTeamFight (app: App.Core): Promise<boolean> {
    const [pokeballs, fightSides] = await Promise.all([
        app.extern.evaluateResult(() => window.many('form[method=post][name^="pokeball_"]').map((elems) => elems.length)),
        app.extern.evaluateResult(() => window.many('.fight-gradient').map((elems) => elems.length)),
    ]);

    return pokeballs === 0 && fightSides !== 0;
}

async function isPokemonEgg (app: App.Core): Promise<boolean> {
    return await app.extern.evaluateResult(() => window
        .many('form[method=post] input[type=hidden][name*=inkubator]')
        .map((elems) => elems.length > 0));
}

async function foundItem (app: App.Core): Promise<boolean> {
    return await app.extern.evaluateResult(() => window
        .many('.found_item_bg')
        .map((elems) => elems.length > 0));
}

async function isMoveTutor (app: App.Core): Promise<boolean> {
    return await app.extern.evaluateResult(() => window
        .many('form[method=post] input[name=learn_move_tutor]')
        .map((elems) => elems.length > 0));
}

async function isTrader (app: App.Core): Promise<boolean> {
    return await app.extern.evaluateResult(() => window
        .many('form[method=post] input[name=replace_items]')
        .map((elems) => elems.length > 0));
}

export async function getFoundItem (app: App.Core): Promise<string> {
    return await app.extern.evaluateResult(() => window
        .one('.found_item_bg img', null)
        .map((elem) => elem.attr('src'))
        .map((source) => {
            const chunks = source.split('/');
            const name = chunks[chunks.length - 1];
            return name && window.toName(name.replace('.png', ''));
        })
    );
}

export async function getHuntResult (app: App.Core): Promise<HUNT_RESULT> {
    const [
        pokemonEncounter,
        pokemonEgg,
        teamFight,
        item,
        moveTutor,
        trader,
    ] = await Promise
        .all([
            isPokemonEncounter(app),
            isPokemonEgg(app),
            isTeamFight(app),
            foundItem(app),
            isMoveTutor(app),
            isTrader(app),
        ]);
    

    if (pokemonEncounter) {
        return HUNT_RESULT.POKEMON_ENCOUNTER;
    }

    if (teamFight) {
        return HUNT_RESULT.TEAM_FIGHT;
    }

    if (pokemonEgg) {
        return HUNT_RESULT.POKEMON_EGG;
    }

    if (item) {
        return HUNT_RESULT.ITEM;
    }

    if (moveTutor) {
        return HUNT_RESULT.MOVE_TUTOR;
    }

    if (trader) {
        return HUNT_RESULT.TRADER;
    }

    return HUNT_RESULT.NOTHING;
}

