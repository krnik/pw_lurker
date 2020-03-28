import type {App} from "../../types";
import {HUNT_RESULT} from "../../constants.js";

async function isPokemonEncounter (app: App): Promise<boolean> {
    return await app.page.getElems('.loc-poke').then((elems) => elems.length !== 0);
}

async function isTeamFight (app: App): Promise<boolean> {
    const pokeballSelector = 'form[method=post][name^="pokeball_"]';
    const fightSidesSelector = '.fight-gradient';

    const [pokeballs, fightSides] = await Promise.all([
        app.page.getElems(pokeballSelector),
        app.page.getElems(fightSidesSelector)
    ]);

    return pokeballs.length === 0 && fightSides.length !== 0;
}

async function isPokemonEgg (app: App): Promise<boolean> {
    const selector = 'form[method=post] input[type=hidden][name*=inkubator]';
    return await app.page.getElems(selector).then((elems) => elems.length !== 0);
}

async function foundItem (app: App): Promise<boolean> {
    const selector = '.found_item_bg';
    return await app.page.getElems(selector).then((elems) => elems.length !== 0);
}

async function isMoveTutor (app: App): Promise<boolean> {
    const selector = 'form[method=post] input[name=learn_move_tutor]';
    return await app.page.getElems(selector).then((elems) => elems.length !== 0);
}

async function isTrader (app: App): Promise<boolean> {
    const selector = 'form[method=post] input[name=replace_items]';
    return await app.page.getElems(selector).then((elems) => elems.length !== 0);
}


export async function getHuntResult (app: App): Promise<HUNT_RESULT> {
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

export async function tryTakeItems (app: App): Promise<void> {
    const selector = 'input[name="zdejmij_przedmioty"]';
    const [submit] = await app.page.getElems(selector);
    if (submit) {
        await app.page.clickNavigate(selector);
    }
}
