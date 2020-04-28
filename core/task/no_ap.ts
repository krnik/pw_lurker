import { Task } from "../types";
import { TASK, ROUTE } from "../constants";

const ACCEPT_WORK = '.work_box:last-of-type [name=przyjmij_oferte]';
const FINISH_WORK = '#aktywna_praca [name=zakoncz_prace]';
const OAK = 'form[method=post] input[type=submit][name=drink][id="tutorial-oak-button"]';
const JUNIPIER = 'form[method=post] > input[value="664"] ~ input[type=submit]';

function getWaitTime () {
    const minutes = new Date().getMinutes();
    const time = (minutes >= 30 ? 61 : 32) - minutes;
    return time * 60 * 1000;
}

export const NoAP: Task = {
    name: TASK.NO_AP,
    async perform (app, _params) {
        const behaviour = app.config['hunt.noAP'];

        switch (behaviour) {
            case 'oak':
                await app.extern.ensurePathname(ROUTE.INVENTORY);
                await app.extern.clickAndNavigate(OAK);
                break;

            case 'junipier':
                await app.extern.ensurePathname(ROUTE.INVENTORY);
                await app.extern.clickAndNavigate(JUNIPIER);
                break;

            case 'wait':
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

                break;
        }
    },
};
