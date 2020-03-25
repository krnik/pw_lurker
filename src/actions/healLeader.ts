import { Action, Option, Route, HealMethod } from "../types";
import type { Page } from '../page';
import type {Environment} from "../info/environment";
import {ActionName} from "../types.js";
import {some, chain, toMoneyAmount} from "../utils";
import {withdrawMoney} from "./withdrawMoney";

function healWithJuice (page: Page): Promise<boolean> {
    const SELECTOR = '#form_feed_poke_favourite_drink input[type=submit]';

    return page.ensurePath(Route.Leader)
        .then(() => page.getElem(SELECTOR))
        .then((btn) => btn.click())
        .then(() => page.waitForNavigation())
        .then(() => true)
        .catch((error) => {
            page.logger.error({ error, msg: 'Juice healing failed' });
            return false;
        });
}

function healWithHerb (page: Page): Promise<boolean> {
    const SELECTOR = '#form_feed_poke_revival_herb input[type=submit]';

    return page.ensurePath(Route.Leader)
        .then(() => page.getElem(SELECTOR))
        .then((btn) => btn.click())
        .then(() => page.waitForNavigation())
        .then(() => true)
        .catch((error) => {
            page.logger.error({ error, msg: 'Herb healing failed' });
            return false;
        });
}

function healWithMoney (page: Page, env: Environment): Promise<boolean> {
    const healHref = `${Route.Hospital}/${env.data.team.leader.id}`;
    const PRICE_SELECTOR = `.niceButton.full_width.tutorial-heal-button[href=${healHref}]`;

    return page.ensurePath(Route.Hospital)
        .then(() => page.getText(PRICE_SELECTOR))
        .then(toMoneyAmount)
        .then((price) => {
            if (price <= env.data.moneyAmount) {
                return;
            }

            env.setMoneyToWithdraw(price);
            return withdrawMoney.perform(page, env);
        })
        .then(() => true)
        .catch((error) => {
            page.logger.error({ error, msg: 'Money healing failed' });
            return false;
        });
    
}

function healByWaiting (page: Page): Promise<boolean> {
    const minutes = 30 - (new Date().getMinutes() % 30);

    return page.waitFor(minutes * 60 * 1000)
        .then(() => true)
        .catch((error) => {
            page.logger.error({ error, msg: 'Waiting healing failed' });
            return false;
        });
}

function heal (method: HealMethod): (page: Page, env: Environment) => Promise<boolean> {
    switch (method) {
        case 'juice': return healWithJuice; 
        case 'money': return healWithMoney;
        case 'herb': return healWithHerb;
        case 'wait': return healByWaiting;
    }
}

export const healLeader: Action = {
    name: ActionName.HealLeader,
    async perform (page: Page, env: Option<Environment>): Promise<void> {
        const healMethods = page.config('leader.healMethod');

        for (const method of healMethods) {
            if (await heal(method)(page, some(env))) {
                break;
            }
        }
    }
};
