import type {Task} from "../types";
import {TASK, ROUTE} from "../constants.js";

export const SellPokemons: Task = {
    name: TASK.SELL_POKEMONS,
    async perform (app, _params) {
        await app.extern.ensurePathname(ROUTE.BREEDING);
        await app.extern.submitAndNavigate('sellAll');
    },
};
