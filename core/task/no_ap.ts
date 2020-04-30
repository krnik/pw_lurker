import { App } from "../types";
import { TASK, ROUTE } from "../constants";

const OAK = 'form[method=post] input[type=submit][name=drink][id="tutorial-oak-button"]';
const JUNIPIER = 'form[method=post] > input[value="664"] ~ input[type=submit]';

export const NoAP: App.TaskImpls<TASK.NO_AP> = {
    name: TASK.NO_AP,
    async perform (app) {
        loop: for (const refillMethod of app.config['hunt.noAP']) {
            switch (refillMethod) {
                case 'oak': {
                    await app.extern.ensurePathname(ROUTE.INVENTORY);
                    const hasOakDrinks = await app.extern.evaluateResult(() => window
                        .one('#item_drink_container img[src*="/img/items/dr_oak_drink.png"]', null)
                        .mapOrElse(() => true, () => false)
                    );

                    if (!hasOakDrinks) {
                        continue loop;
                    }

                    return await app.extern.clickAndNavigate(OAK);
                }
                case 'junipier': {
                    await app.extern.ensurePathname(ROUTE.INVENTORY);
                    const hasJunipierDrinks = await app.extern.evaluateResult(() => window
                        .one('#item_drink_container img[src*="/img/items/prof_juniper_drink.png"]', null)
                        .mapOrElse(() => true, () => false)
                    );

                    if (!hasJunipierDrinks) {
                        continue loop;
                    }

                    return await app.extern.clickAndNavigate(JUNIPIER);
                }
                case 'wait': {
                    return await app.execute(TASK.WAIT);
                }
            }
        }
    },
};
