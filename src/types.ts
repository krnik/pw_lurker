import type { Page } from "./page";
import type { Environment } from "./info/environment";

export type None = null | undefined;
export type Some<T> = T;
export type Or<T, Y> = T | Y;
export type Option<T> = Or<Some<T>, None>;
export type OrPromise<T> = Or<T, Promise<T>>;

export type Action = {
    name: ActionName;
    perform: (page: Page, environment: Option<Environment>) => Promise<void>;
}

export type ExternResult = {
    success: boolean;
    log: string[];
};

declare global {
    export type TabName = 'team' | 'catch' | 'oak' | 'daily' | 'event' | 'stow_quest' | 'profesor_samson';
    export function evolve (id: number): Promise<ExternResult[]>;
    export function changePanelTab(tabName: TabName, updateContent: boolean): Promise<ExternResult[]>;
}

export type HealMethod = ('juice' | 'money' | 'herb' | 'wait'); 
export type Config = {
    'user.password': string;
    'user.login': string;
    'bot.headless': boolean;
    'leader.minHealth': number;
    'leader.healMethod': HealMethod[];
};

export const enum ActionName {
    Login = 'action-login',
    EvolvePokemons = 'action-evolve-pokemons',
    SellPokemons = 'action-sell-pokemons',
    DepositMoney = 'action-deposit-money',
    HealLeader = 'action-heal-leader',
    WithdrawMoney = 'action-withdraw-money',
    Wait = 'action-wait',
}

export const enum Route {
    Team = 'druzyna',
    Bank = 'depozyt',
    Breeding = 'hodowla',
    Hospital = 'lecznica',
    Leader = 'stan',
}

