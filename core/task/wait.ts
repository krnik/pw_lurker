import type {Task} from "../types";
import {TASK, ROUTE} from "../constants.js";

const ACCEPT_WORK = '.work_box:last-of-type [name=przyjmij_oferte]';
const FINISH_WORK = '#aktywna_praca [name=zakoncz_prace]';

export const Wait: Task = {
    name: TASK.WAIT,
    async perform (app, _params) {
        await app.page.ensurePath(ROUTE.WORK);

        const minutes = 32 - (new Date().getMinutes() % 30);
        const ms = minutes * 60 * 1000;

        app.logger.debug({
            ms,
            minutes,
            msg: 'Waiting',
        });

        if (await app.config('bot.workOnWait')) {
            const working = await app.page.clickNavigate(ACCEPT_WORK)
                .then(() => true)
                .catch(() => false);

            await app.sleep(ms);

            if (working) {
                await app.page.clickNavigate(FINISH_WORK);
            }
        } else {
            await app.sleep(ms);
        }
    },
};
