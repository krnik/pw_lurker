import type {App} from "../types";
import {TASK, ROUTE} from "../constants.js";

export const SellPokemons: App.TaskImpls<TASK.SELL_POKEMONS> = {
    name: TASK.SELL_POKEMONS,
    async perform (app) {
        await app.extern.ensurePathname(ROUTE.BREEDING);
        await app.extern.submitAndNavigate('sellAll');
    },
};
