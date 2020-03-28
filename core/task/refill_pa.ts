import {Task} from "../types";
import {TASK, ROUTE} from "../constants.js";

const OAK = 'form[method=post] input[type=submit][name=drink][id="tutorial-oak-button"]';
const JUNIPIER = 'form[method=post] > input[value="664"] ~ input[type=submit]';

export const RefillPA: Task = {
    name: TASK.REFILL_PA,
    async perform (app, _params) {
        const method = await app.config('hunt.refillMethod');   

        switch (method) {
            case 'wait':
                await app.execute(TASK.WAIT, {});
                break;

            case 'oak':
                await app.page.ensurePath(ROUTE.INVENTORY);
                await app.page.clickNavigate(OAK);
                break;

            case 'junipier':
                await app.page.ensurePath(ROUTE.INVENTORY);
                await app.page.clickNavigate(JUNIPIER);
                break;
        }
    },
};
