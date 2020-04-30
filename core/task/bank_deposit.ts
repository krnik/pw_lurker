import type {App} from "../types";
import {TASK, ROUTE} from "../constants.js";

const DEPOSIT_BTN = 'input[name=wplata_all]';

export const BankDeposit: App.TaskImpls<TASK.BANK_DEPOSIT> = {
    name: TASK.BANK_DEPOSIT,
    async perform (app) {
        await app.extern.ensurePathname(ROUTE.BANK);
        await app.extern.clickAndNavigate(DEPOSIT_BTN);
    },
};
