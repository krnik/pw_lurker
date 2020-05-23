import { App } from "../types";
import { TASK, ROUTE } from "../constants";
import {evaluateCondition} from "../condition";

const OAK = 'form[method=post] input[type=submit][name=drink][id="tutorial-oak-button"]';
const JUNIPER = 'form[method=post] > input[value="664"] ~ input[type=submit]';

async function getItemCount (app: App.Core, itemName: string): Promise<number> {
    return app.extern.evaluateResult((item: string) => {
        const selector = `img[src*="${item}"] ~ div.item_name`;
        return window
            .one(selector, null)
            .mapOrElse((elem) => elem.text(), () => '(0)')
            .map((text) => {
                const count = /\d+/.exec(text);
                const numeric = count ? count[0] : '0';
                return window.num(numeric);
            });
    }, itemName);
}

export const NoAP: App.TaskImpls<TASK.NO_AP> = {
    name: TASK.NO_AP,
    async perform (app) {
        try {
        await app.extern.ensurePathname(ROUTE.INVENTORY);
        const refillMethods = app.config['hunt.noAP'];

        const [oakCount, juniperCount] = await Promise.all([
            getItemCount(app, 'dr_oak_drink'),
            getItemCount(app, 'prof_juniper_drink'),
        ]);

        for (const method of refillMethods) {
            if (method === 'wait') {
                return app.execute(TASK.WAIT);
            }
            
            if (method.target = 'oak') {
                const canDrink = method.type === 'always'
                    ? true
                    : evaluateCondition({ gt: method.gt }, oakCount);
                if (canDrink) {
                    return await app.extern.clickAndNavigate(OAK);
                }
            } else {
                const canDrink = method.type === 'always'
                    ? true
                    : evaluateCondition({ gt: method.gt }, juniperCount);
                if (canDrink) {
                    return await app.extern.clickAndNavigate(JUNIPER);
                }
            }
        }

        return app.execute(TASK.WAIT);
        } catch (err) {
            console.log(err);
            await app.sleep(1000000);
        }
    },
};
