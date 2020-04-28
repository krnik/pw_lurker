import type {Task, App, Config} from "../types";
import {TASK, ROUTE} from "../constants.js";
import {toMoneyAmount, unreachable} from "../utils.js";

async function healWithJuice (app: App.Core, viewLeader: () => Promise<void>): Promise<boolean> {
    const SELECTOR = '#form_feed_poke_favourite_drink input[type=submit]';

    return await viewLeader()
        .then(() => app.extern.clickAndNavigate(SELECTOR))
        .then(() => true)
        .catch((error) => {
            app.logger.error({ error, msg: 'Juice healing failed' });
            return false;
        });
}

async function healWithHerb (app: App.Core, viewLeader: () => Promise<void>): Promise<boolean> {
    const SELECTOR = '#form_feed_poke_revival_herb input[type=submit]';

    return await viewLeader()
        .then(() => app.extern.clickAndNavigate(SELECTOR))
        .then(() => true)
        .catch((error) => {
            app.logger.error({ error, msg: 'Herb healing failed' });
            return false;
        });
}

async function healWithMoney (app: App.Core): Promise<boolean> {
    const healHref = `${ROUTE.HOSPITAL}/${app.state.leader.id}`;
    const PRICE_SELECTOR = `.niceButton.full_width.tutorial-heal-button[href=${healHref}]`;
    const HEAL_SELECTOR = ``;

    return await app.extern.ensurePathname(ROUTE.HOSPITAL)
        .then(() => app.extern.evaluate(() => window.one(PRICE_SELECTOR, null)))
        .then((e) => {})
        .then(() => app.extern.getText(PRICE_SELECTOR))
        .then(toMoneyAmount)
        .then((amount) => {
            if (amount <= app.state.moneyAmount) {
                return;
            }
            return app.execute(TASK.BANK_WITHDRAW, { amount });
        })
        .then(() => app.page.ensurePath(ROUTE.HOSPITAL))
        .then(() => app.page.clickNavigate(HEAL_SELECTOR))
        .then(() => true)
        .catch((error) => {
            app.logger.error({ error, msg: 'Money healing failed' });
            return false;
        });
    
}

async function healByWaiting (app: App.Core): Promise<boolean> {
    const minutes = new Date().getMinutes();
    const time = (minutes >= 30 ? 61 : 32) - minutes;
    const ms = time * 60 * 1000;

    app.logger.debug({
        ms,
        msg: 'Healing by waiting',
        ends: new Date(Date.now() + ms)
    });

    return await app.sleep(time * 60 * 1000)
        .then(() => true)
        .catch((error) => {
            app.logger.error({ error, msg: 'Waiting healing failed' });
            return false;
        });
}

function heal (method: Config.HealMethod): (app: App.Core, viewLeader: () => Promise<void>) => Promise<boolean> {
    switch (method) {
        case 'juice': return healWithJuice; 
        case 'money': return healWithMoney;
        case 'herb': return healWithHerb;
        case 'wait': return healByWaiting;
        default: return unreachable();
    }
}

export const HealLeader: Task = {
    name: TASK.HEAL,
    async perform (app, _params) {
        const healMethods = app.config['leader.healMethod'];
        const leaderPath = `${ROUTE.POKE_STATE}/${app.state.leader.id}`;
        const viewLeader = async () => await app.page.ensurePath(leaderPath);

        for (const method of healMethods) {
            app.logger.debug({
                method,
                msg: 'Trying to heal',
            });
            if (await heal(method)(app, viewLeader)) {
                break;
            }
        }

        await app.page.ensurePath(ROUTE.START);
        await app.page.reload();
    },
};

