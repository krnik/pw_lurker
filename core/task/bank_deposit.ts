import type {Task} from "../types";
import {TASK, ROUTE} from "../constants.js";

const DEPOSIT_BTN = 'input[name=wplata_all]';

export const BankDeposit: Task = {
    name: TASK.BANK_DEPOSIT,
    async perform (app, _params) {
        await app.extern.ensurePathname(ROUTE.BANK);
        await app.extern.clickAndNavigate(DEPOSIT_BTN);
    },
};
