import { App } from "../types";
import { TASK, ROUTE } from "../constants";

const ACCEPT_WORK = '.work_box:last-of-type [name=przyjmij_oferte]';
const FINISH_WORK = '#aktywna_praca [name=zakoncz_prace]';

function getWaitTime () {
    const minutes = new Date().getMinutes();
    const time = (minutes >= 30 ? 61 : 32) - minutes;
    return time * 60 * 1000;
}

export const Wait: App.TaskImpls<TASK.WAIT> = {
    name: TASK.WAIT,
    async perform (app) {
        const work = app.config['bot.workWhileWaiting'];
        const ms = getWaitTime();


        app.logger.info({
            ms,
            ends: new Date(Date.now() + ms).toUTCString(),
            msg: 'Waiting',
        });

        if (work) {
            await app.extern.ensurePathname(ROUTE.WORK);
            const working = await app.extern.clickAndNavigate(ACCEPT_WORK)
                .then(() => true)
                .catch(() => false);
            await app.sleep(ms);

            if (working) {
                await app.extern.clickAndNavigate(FINISH_WORK);
            }
        } else {
            await app.extern.ensurePathname(ROUTE.START);
            await app.sleep(ms);
            await app.extern.reload();
        }
    }
};
