import type {Task, State} from "../types";
import {TASK, ROUTE} from "../constants.js";

export const EvolvePokemons: Task = {
    name: TASK.EVOLVE_POKEMONS,
    async perform (app, _params) {
        await app.extern.ensurePathname(ROUTE.TEAM);

        // process.exit(1);
        throw new Error('Unimplemented');

        function shouldMoveToPokebox(pokemon: State.ReservePokemon) {
            return pokemon === undefined;
        }
        
        for (let i = 0; i < 3; i++) {
            for (const pokemon of await app.extern.getReservePokemons()) {
                if (shouldMoveToPokebox(pokemon)) {
                    // moveToPokebox
                }

                if (pokemon.canEvolve) {
                    app.logger.debug({
                        pokemon,
                        msg: 'Evolving pokemon',
                    });
                    // evolve | evolveAdvanced
                }
                

                await app.sleep(Math.floor(Math.random() * 300));
            }
        }
    },
};
