import type { App } from '../types';
import {TASK, ROUTE} from "../constants.js";

const BTN = 'input[name=wyplata]';
const INPUT = '.niceInput.depo_input[class$=input]';

export const BankWithdraw: App.TaskImpls<TASK.BANK_WITHDRAW> = {
    name: TASK.BANK_WITHDRAW,
    async perform (app, { amount }) {
        await app.extern.ensurePathname(ROUTE.BANK);
        await app.extern.type(INPUT, amount.toString());
        await app.extern.clickAndNavigate(BTN);
    }
};
