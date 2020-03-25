import type {Task, App, Config} from "../types";
import {TASK, ROUTE} from "../constants.js";
import {toMoneyAmount, unreachable} from "../utils.js";

async function healWithJuice (app: App, viewLeader: () => Promise<void>): Promise<boolean> {
    const SELECTOR = '#form_feed_poke_favourite_drink input[type=submit]';

    return await viewLeader()
        .then(() => app.page.clickNavigate(SELECTOR))
        .then(() => true)
        .catch((error) => {
            app.logger.error({ error, msg: 'Juice healing failed' });
            return false;
        });
}

async function healWithHerb (app: App, viewLeader: () => Promise<void>): Promise<boolean> {
    const SELECTOR = '#form_feed_poke_revival_herb input[type=submit]';

    return await viewLeader()
        .then(() => app.page.clickNavigate(SELECTOR))
        .then(() => true)
        .catch((error) => {
            app.logger.error({ error, msg: 'Herb healing failed' });
            return false;
        });
}

async function healWithMoney (app: App): Promise<boolean> {
    const healHref = `${ROUTE.HOSPITAL}/${app.state.team.leader.id}`;
    const PRICE_SELECTOR = `.niceButton.full_width.tutorial-heal-button[href=${healHref}]`;
    const HEAL_SELECTOR = ``;

    return await app.page.ensurePath(ROUTE.HOSPITAL)
        .then(() => app.page.getText(PRICE_SELECTOR))
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

async function healByWaiting (app: App): Promise<boolean> {
    const minutes = 30 - (new Date().getMinutes() % 30);

    return await app.sleep(minutes * 60 * 1000)
        .then(() => true)
        .catch((error) => {
            app.logger.error({ error, msg: 'Waiting healing failed' });
            return false;
        });
}

function heal (method: Config.HealMethod): (app: App, viewLeader: () => Promise<void>) => Promise<boolean> {
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
        const healMethods = await app.config('leader.healMethod');
        const leaderPath = `${ROUTE.POKE_STATE}/${app.state.team.leader.id}`;
        const viewLeader = async () => await app.page.ensurePath(leaderPath);

        for (const method of healMethods) {
            if (await heal(method)(app, viewLeader)) {
                break;
            }
        }
    },
};

