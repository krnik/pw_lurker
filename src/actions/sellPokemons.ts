import { Action, ActionName, Route } from "../types.js";
import type {Page} from "../page";

const SELECTOR = 'input[id=sellAll] .niceButton';

export const sellPokemons: Action = {
    name: ActionName.SellPokemons,
    async perform (page: Page): Promise<void> {
        await page.ensurePath(Route.Breeding);
        await page.clickAndWait(SELECTOR);
    },
};
