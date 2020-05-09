import type {App} from "../types";
import {TASK, ROUTE, EVENT} from "../constants.js";

function getPokemonPrice (app: App.Core): Promise<number> {
    return app.extern.evaluateResult(() => window.one('#sellAll input[type=button]', null)
            .map((elem) => elem.attr('value'))
            .map((attr) => window.toMoneyAmount(attr)));
}

export const SellPokemons: App.TaskImpls<TASK.SELL_POKEMONS> = {
    name: TASK.SELL_POKEMONS,
    async perform (app) {
        await app.extern.ensurePathname(ROUTE.BREEDING);

        app.stats.add(EVENT.SELL_POKEMONS, await getPokemonPrice(app));

        await app.extern.submitAndNavigate('sellAll');
    },
};

