import type { App, State } from "../../types";
import {some} from "../../utils.js";
import {POKEBALLS, EVENT} from "../../constants";
import {getPokeballToThrow} from "./get_pokeball_to_throw";

async function wasCaught (app: App.Core): Promise<boolean> {
    const count = await app.extern.evaluateResult(() => window.many('.found_pokemon_bg').map((arr) => arr.length));
    return count > 0;
}

async function throwPokeball (app: App.Core, pokeball: string): Promise<void> {
    app.stats.add(EVENT.THROW_POKEBALL, pokeball);
    const formName = `pokeball_${pokeball[0].toUpperCase() + pokeball.slice(1)}`;
    await app.extern.submitAndNavigate(formName);
}

export async function throwPokeballs (app: App.Core, encounteredPokemon: State.EncounterPokemon): Promise<void> {
    app.logger.info({ msg: 'Choosing pokeballs' });

    const pokeballSettings = app.config['hunt.pokeballs'].slice();

    while (pokeballSettings.length > 0) {
        const availablePokeballs = await app.extern.getPokeballInfo();
        const setting = some(pokeballSettings.shift());

        app.logger.debug({
            setting,
            encounteredPokemon,
            availablePokeballsCount: availablePokeballs.length,
            msg: 'Evaluating pokeball throw setting',
        });

        const pokeball = getPokeballToThrow(availablePokeballs, encounteredPokemon, setting);

        if (pokeball === null) {
            app.logger.debug({ setting, msg: 'Skipping' });
            continue;
        }

        app.logger.info({ pokeball, msg: 'Using pokeball' });

        if (pokeball.name === 'netball') {
            await throwPokeball(app, pokeball.name);
            if (await wasCaught(app)) {
                return;
            }

            continue;
        }

        if (POKEBALLS.REPEATABLE.includes(pokeball.name as any)) {
            let caught = false;
            let thrown = 0;
            let hasMore = true;

            while (hasMore && caught === false) {
                await throwPokeball(app, pokeball.name);

                caught = await wasCaught(app);

                thrown += 1;
                hasMore = thrown < pokeball.quantity;
            }

            if (caught) {
                app.logger.debug({
                    encounteredPokemon,
                    msg: 'Caught pokemon',
                });
            } else {
                app.logger.warn({
                    pokeball,
                    msg: 'Out of pokeballs',
                });
            }

            return;
        }

        return await throwPokeball(app, pokeball.name);
    }

    throw new Error('No pokeball was thrown to catch the pokemon');
}

