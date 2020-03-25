import type { Action } from "../types";
import type { Page } from '../page';
import { ActionName, Route } from "../types.js";
import { toNumber, some, sleep } from "../utils.js";

export const evolvePokemons: Action = {
    name: ActionName.EvolvePokemons,
    async perform (page: Page): Promise<void> {
        await page.ensurePath(Route.Team);

        const noFurtherEvo = new Set();

        for (let i = 0; i < 3; i++) {
            const evoButtons = await page.$$('#poke_content a[onclick^=evolve]');

            for (const evo of evoButtons) {
                const pokemonId = await evo
                    .evaluate((self) => self.getAttribute('onclick'))
                    .then(some)
                    .then((attr) => attr.replace(/^.*\((\d+)\).*$/, (_, g1) => g1))
                    .then(toNumber);

                if (noFurtherEvo.has(pokemonId)) {
                    continue;
                }

                page.logger.debug({ 
                    pokemonId,
                    msg: 'Evolving pokemon',
                });

                const result = await page.evaluate(async (id) => await evolve(id), pokemonId);

                for (const res of result) {
                    if (!res.success) {
                        noFurtherEvo.add(pokemonId);
                    }
                }

                page.logger.trace({
                    msg: '[evolve] extern call result',
                    log: result,
                });

                await sleep(Math.floor(Math.random() * 300));
                page.logger.debug({
                    pokemonId,
                    msg: 'Pokemon evolved',
                });
            }
        }
    },
};
