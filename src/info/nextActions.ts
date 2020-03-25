import type { Page } from "../page";
import type { Action, Option } from '../types';
import { ActionName } from "../types.js";
import { Environment } from './environment.js';
import {login} from "../actions/login.js";
import {sellPokemons} from "../actions/sellPokemons.js";
import {evolvePokemons} from "../actions/evolvePokemons.js";
import {unreachable} from "../utils.js";
import {depositMoney} from "../actions/depositMoney.js";
import {healLeader} from "../actions/healLeader.js";

function isFrontPage (url: string): boolean {
    return url.startsWith('https://pokewars.pl');
}

export function getAction (name: ActionName): Action {
    switch (name) {
        case ActionName.Login: return login;
        case ActionName.SellPokemons: return sellPokemons;
        case ActionName.EvolvePokemons: return evolvePokemons;
        case ActionName.DepositMoney: return depositMoney;
        case ActionName.HealLeader: return healLeader;
        default: unreachable();
    }
}

type NextActions = {
    environment: Option<Environment>;
    actions: ActionName[];
};

export async function getNextActions (page: Page, prevEnv: Option<Environment>): Promise<NextActions> {
    const currentUrl = await page.evaluate(() => window.location.href);

    const done = (actions: ActionName[], environment: Option<Environment>) => ({
        actions,
        environment,
    });

    if (isFrontPage(currentUrl)) {
        return done([ActionName.Login], prevEnv);
    }

    // Get Full Environment Info
    // Setup UI for easier access of crucial info
    const nextEnv = await (prevEnv || Environment.get(page));

    switch (true) {
        case !nextEnv.isLeaderHealthy():
            return done([ActionName.HealLeader], nextEnv);

        case nextEnv.isPokeboxFull():
            return done([
                ActionName.EvolvePokemons,
                ActionName.SellPokemons,
            ], nextEnv);

        case nextEnv.hasMoneyInPocket():
            return done([
                ActionName.DepositMoney,
            ], nextEnv);

        // Check if AP needs a refill
        // Hunt

        default:
            return done([], nextEnv);
    }
}
