import type { App, Config } from "../../types";
import {some} from "../../utils.js";

async function wasCaught (app: App.Core): Promise<boolean> {
    const selector = '.found_pokemon_bg';
    return await app.page.getElems(selector).then((elems) => elems.length !== 0);
}

async function throwPokeball (app: App.Core, pokeball: string): Promise<void> {
    const formName = `pokeball_${pokeball[0].toUpperCase() + pokeball.slice(1)}`;
    await app.page.submitNavigate(formName);
}

async function hasPokeball (app: App.Core, pokeball: string): Promise<boolean> {
    const formName = `pokeball_${pokeball[0].toUpperCase() + pokeball.slice(1)}`;
    const unblocked = `form[name="${formName}"]`;
    const blocked = `form[id="${formName}"]`;

    return await Promise
        .all([
            app.page.getElems(unblocked),
            app.page.getElems(blocked),
        ])
        .then(([balls, ballsB]) => balls.length > 0 || ballsB.length > 0);
}

// TODO: Add shiny + starter cases
// TODO: Add level cases
// TODO: Fix false "out of pokeballs" message
// [1585418585332] DEBUG (23943 on al006): Page.getElems
//     acc: "OmgNoCoJaRobie"
//     selector: "form[method=post] input[name=pokeball][value=\"Netball\"]"
// [1585418585335] WARN  (23943 on al006): Out of pokeballs
//     acc: "OmgNoCoJaRobie"
//     pokeball: {
//       "name": "netball",
//       "when": "always"
//     }

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

function shouldThrow (pokeball: Config.PokeballThrowInfo, pokemon: { name: string, level: number, types: string[] }): boolean {
    switch (pokeball.when) {
        case 'always':
            return true;

        case 'starter':
            return STARTERS.includes(pokemon.name);

        case 'shiny':
            return pokemon.name.startsWith('shiny');

        case 'name':
            return Array.isArray(pokeball.eq) && pokeball.eq.includes(pokeball.name);

        case 'type':
            return Array.isArray(pokeball.eq) && pokeball.eq.some((type) => pokemon.types.includes(type));

        default:
            return false;
    }
}

export async function throwPokeballs (app: App.Core, info: { name: string, level: number, types: string[] }): Promise<void> {
    const pokeballs = app.config['hunt.pokeballs'].slice();

    while (pokeballs.length > 0) {
        const pokeball = some(pokeballs.shift());

        app.logger.info({
            pokeball,
            pokemon: info,
            msg: 'Next Pokeball',
        });


        if (!shouldThrow(pokeball, info)) {
            app.logger.info({
                pokeball,
                pokemon: info,
                msg: 'Skipping pokeball due to different requirements',
            });
            continue;
        }

        if (!(await hasPokeball(app, pokeball.name))) {
            app.logger.warn({
                pokeball,
                msg: 'Out of pokeballs',
            });
            continue;
        }

        if (['netball'].includes(pokeball.name)) {
            await throwPokeball(app, pokeball.name);

            if (await wasCaught(app)) {
                return;
            }

            continue;
        }

        if (['swarmball', 'repeatball'].includes(pokeball.name)) {
            let caught = false;
            let hasMore = true;

            while (hasMore && caught === false) {
                await throwPokeball(app, pokeball.name);
                [caught, hasMore] = await Promise.all([
                    wasCaught(app),
                    hasPokeball(app, pokeball.name),
                ]);
            }

            return;
        }

        return await throwPokeball(app, pokeball.name);
    }
}

