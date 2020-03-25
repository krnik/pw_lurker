import type {Task} from "../types";
import {props, some, is} from "../utils.js";
import {TASK, ROUTE} from "../constants.js";

const BTN = 'input[name=wyplata]';
const INPUT = '.niceInput.depo_input[class$=input]';

export const BankWithdraw: Task = {
    name: TASK.BANK_WITHDRAW,
    async perform (app, params) {
        const [amount] = props(some(params), ['amount']).map(is.str);

        await app.page.ensurePath(ROUTE.BANK);
        await app.page.type(INPUT, amount.toString());
        await app.page.clickNavigate(BTN);
    }
};
