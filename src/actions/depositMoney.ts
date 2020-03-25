import type { Action } from "../types";
import type { Page } from '../page';
import { ActionName, Route } from "../types.js";

const SELECTOR = 'input[name=wplata_all]';

export const depositMoney: Action = {
    name: ActionName.DepositMoney,
    async perform (page: Page): Promise<void> {
        await page.ensurePath(Route.Bank);
        await page.clickAndWait(SELECTOR);
    },
};
