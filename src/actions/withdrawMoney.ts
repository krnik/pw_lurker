import type { Action, Option } from "../types";
import type { Page } from '../page';
import { ActionName, Route } from "../types.js";
import {Environment} from "../info/environment";
import {some} from "../utils";

const BTN_SELECTOR = 'input[name=wyplata]';
const INPUT_SELECTOR = '.niceInput.depo_input[class$=input]';

export const withdrawMoney: Action = {
    name: ActionName.WithdrawMoney,
    async perform (page: Page, env: Option<Environment>): Promise<void> {
        await page.ensurePath(Route.Bank);

        const inputText = some(some(env).getMoneyToWithdraw()).toString();
        await page.type(INPUT_SELECTOR, inputText);
        some(env).setMoneyToWithdraw(null);

        await page.clickAndWait(BTN_SELECTOR);
    },
};
