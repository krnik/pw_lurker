import type {Task} from "../types";
import {TASK} from "../constants.js";

const ACCEPT_WORK = '.work_box:last-of-type [name=przyjmij_oferte]';

export const Wait: Task = {
    name: TASK.WAIT,
    async perform (app, _params) {
        const minutes = 30 - (new Date().getMinutes() % 30);
        const ms = minutes * 60 * 1000;

        if (await app.config('bot.workOnWait')) {
            // TODO: Check if work is available
            await app.page.clickNavigate(ACCEPT_WORK);
            await app.sleep(ms);
        } else {
            await app.sleep(ms);
        }
    },
};
