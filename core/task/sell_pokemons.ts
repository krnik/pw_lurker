import type {Task} from "../types";
import {TASK, ROUTE} from "../constants.js";

const SELECTOR = 'input[id=sellAll] .niceButton';

export const SellPokemons: Task = {
    name: TASK.SELL_POKEMONS,
    async perform (app, _params) {
        await app.page.ensurePath(ROUTE.BREEDING);
        await app.page.clickNavigate(SELECTOR);
    },
};
