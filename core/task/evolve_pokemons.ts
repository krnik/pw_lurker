import type {Task} from "../types";
import {TASK, ROUTE} from "../constants.js";
import {some, toNumber} from "../utils.js";

const EVOLUTION_BTN = '#poke_content a[onclick^=evolve]';
const ID_REGEX = /^.*\((\d+)\).*$/;

export const EvolvePokemons: Task = {
    name: TASK.EVOLVE_POKEMONS,
    async perform (app, _params) {
        await app.page.ensurePath(ROUTE.TEAM);

        await app.extern.lockShiny();
        const noFurtherEvolutions = new Set();

        for (let i = 0; i < 3; i++) {
            const pokemonIds = await app.page.getAttrs(EVOLUTION_BTN, 'onclick')
                .then((ids) => ids
                    .map((attr) => toNumber(some(attr).replace(ID_REGEX, (_, g1) => g1))));

            for (const id of pokemonIds) {
                if (noFurtherEvolutions.has(id)) {
                    continue;
                }

                app.logger.debug({
                    id,
                    msg: 'Evolving pokemon',
                });

                const results = await app.extern.evolve(id);
                for (const result of results) {
                    if (!result.success) {
                        noFurtherEvolutions.add(id);
                    }
                }

                app.logger.trace({
                    msg: '[evolve]',
                    data: results,
                });

                await app.sleep(Math.floor(Math.random() * 300));

                app.logger.debug({
                    id,
                    msg: 'Pokemon evolved',
                });
            }
        }
    },
};
