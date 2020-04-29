import type { App, Config, State } from "../../types";
import {some} from "../../utils.js";
import {POKEBALLS} from "../../constants";

async function wasCaught (app: App.Core): Promise<boolean> {
    const count = await app.extern.evaluateResult(() => window.many('.found_pokemon_bg').map((arr) => arr.length));
    return count > 0;
}

async function throwPokeball (app: App.Core, pokeball: string): Promise<void> {
    const formName = `pokeball_${pokeball[0].toUpperCase() + pokeball.slice(1)}`;
    await app.extern.submitAndNavigate(formName);
}

async function hasPokeball (app: App.Core, pokeball: string): Promise<boolean> {
    const formName = `pokeball_${pokeball[0].toUpperCase() + pokeball.slice(1)}`;
    const unblocked = `form[name="${formName}"]`;
    const blocked = `form[id="${formName}"]`;

    const count = await app.extern.evaluateResult((unb, bl) => {
        return window.many(unb)
            .mapOrElse(
                (elem) => elem,
                () => window.many(bl),
            )
            .map((elems) => elems.length);
    }, unblocked, blocked);

    return count > 0;
}

const STARTERS = [
    'bulbasaur',
    'charmander',
    'squirtle',
    'chikorita',
    'cyndaquil',
    'totodile',
    'trecko',
    'torchic',
    'mudkip',
    'turtwig',
    'chimchar',
    'piplup',
    'snivy',
    'tepig',
    'oshawott',
    'chespin',
    'fennekin',
    'froakie',
    'rowlet',
    'litten',
    'popplio',
    'grookey',
    'scorbunny',
    'sobble',
];

function shouldThrow (pokeball: Config.PokeballThrow, pokemon: State.EncounterPokemon, pokeballs: State.Pokeball[]): boolean {
    const current = pokeballs.find(({ name }) => name === pokeball.pokeball);

    if (!current) {
        return false;
    }

    return pokeball.when.some(({ type, value }): boolean => {
        switch (type) {
            case 'always':
                return true;
            case 'starter':
                return STARTERS.includes(pokemon.name);
            case 'shiny':
                return pokemon.name.startsWith('shiny');
            case 'name':
                return pokemon.name === some(value);
            case 'level':
                return pokemon.level === some(value);
            case 'chance':
                return current.chance >= some(value);
        }
    });
}

export async function throwPokeballs (app: App.Core, pokemon: State.EncounterPokemon, pokeballs: State.Pokeball[]): Promise<void> {
    const balls = app.config['hunt.pokeballs'].slice();

    while (balls.length > 0) {
        const pokeball = some(balls.shift());

        app.logger.info({
            pokeball,
            pokemon,
            msg: 'Next Pokeball',
        });

        if (!shouldThrow(pokeball, pokemon, pokeballs)) {
            app.logger.info({ msg: 'Skipping pokeball due to different requirements' });
            continue;
        }

        if (!(await hasPokeball(app, pokeball.pokeball))) {
            app.logger.warn({
                pokeball,
                msg: 'Out of pokeballs',
            });
            continue;
        }

        if (['netball'].includes(pokeball.pokeball)) {
            await throwPokeball(app, pokeball.pokeball);

            if (await wasCaught(app)) {
                return;
            }

            continue;
        }

        if (POKEBALLS.REPEATABLE.includes(pokeball.pokeball as any)) {
            let caught = false;
            let hasMore = true;

            while (hasMore && caught === false) {
                await throwPokeball(app, pokeball.pokeball);
                [caught, hasMore] = await Promise.all([
                    wasCaught(app),
                    hasPokeball(app, pokeball.pokeball),
                ]);
            }

            return;
        }

        return await throwPokeball(app, pokeball.pokeball);
    }
}

