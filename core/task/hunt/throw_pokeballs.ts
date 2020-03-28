import type { App } from "../../types";
import {some} from "../../utils.js";

async function wasCaught (app: App): Promise<boolean> {
    const selector = '.found_pokemon_bg';
    return await app.page.getElems(selector).then((elems) => elems.length !== 0);
}

async function throwPokeball (app: App, pokeball: string): Promise<void> {
    const formName = `pokeball_${pokeball[0].toUpperCase() + pokeball.slice(1)}`;
    await app.page.submitNavigate(formName);
}

async function hasPokeball (app: App, pokeball: string): Promise<boolean> {
    const value = pokeball[0].toUpperCase() + pokeball.slice(1);
    const selector = `form[method=post] input[name=pokeball][value="${value}"]`;
    return await app.page.getElems(selector).then((elems) => elems.length !== 0);
}

export async function throwPokeballs (app: App): Promise<void> {
    const pokeballs = (await app.config('hunt.pokeballs')).slice();

    while (pokeballs.length > 0) {
        const pokeball = some(pokeballs.shift());

        app.logger.info({
            pokeball,
            msg: 'Next Pokeball',
        });

        if (!(await hasPokeball(app, pokeball.name))) {
            app.logger.warn({
                pokeball,
                msg: 'Out of pokeballs',
            });
            break;
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

