import { Page, ElementHandle } from "puppeteer";
import { TASK } from "./constants";

export type None = null | undefined;
export type Some<T> = T;
export type Or<T, Y> = T | Y;
export type Option<T> = Or<Some<T>, None>;
export type OrPromise<T> = Or<T, Promise<T>>;
export type Callback<P extends any[] = any[], R = unknown> = (...args: P) => R;
export type Of<T, K extends string & keyof T> = T[K];

export namespace Logger {
    type LogFn = (o: object) => void;

    export interface Core {
        trace: LogFn;
        debug: LogFn;
        error: LogFn;
        info: LogFn;
        fatal: LogFn;
    }
}

export namespace Config {
    export type HealMethod = ('juice' | 'money' | 'herb' | 'wait'); 

    export type Core = {
        'user.password': string;
        'user.login': string;
        'bot.workOnWait': boolean;
        'leader.minHealth': number;
        'leader.healMethod': HealMethod[];
    };
}

export namespace Extern {
    export type Result = {
        success: boolean;
        log: string[];
    }[];
    export type TabName = 'team' | 'catch' | 'oak' | 'daily' | 'event' | 'stow_quest' | 'profesor_samson';

    export interface Core {
        evolve (pokemonId: number): Promise<Result>;
        changePanelTab (tabName: TabName, updateContent: boolean): Promise<Result>;
    };
}

export namespace Page {
    export type Elem = Element;
    export type Handle = ElementHandle<Elem>;
    export type ElemResult = Or<Elem, Handle>;

    export interface Core<R extends ElemResult> {
        getElem (selector: string): Promise<R>;
        getText (selector: string): Promise<string>;
        getAttr (selector: string, attrName: string): Promise<Option<string>>;
        getAttrs (selector: string, attrName: string): Promise<Option<string>[]>;
        click (selector: string): Promise<void>;
        type (selector: string, text: string): Promise<void>;
        clickNavigate (selector: string): Promise<void>;
        currentUrl (): Promise<string>;
        ensurePath (path: string): Promise<void>;
    }
}

export namespace State {
    export type Pokemon = {
        maxHP: number;
        hp: number;
        level: number;
        id: number;
        leader: boolean;
    };

    export type Team = {
        leader: Pokemon;
        team: Pokemon[];
    };

    export type Task = {
        name: TASK;
        params: { [k: string]: Or<number, string> };
    };

    export interface Core {
        actionPointsCount: number;
        maxActionPoinsCount: number;
        pokemonCount: number;
        maxPokemonCount: number;
        moneyAmount: number;
        team: Team;
        tasks: Task[];
    };
}

export interface Task<R extends Page.ElemResult = Page.ElemResult> {
    name: TASK;

    perform (app: App<R>, params?: Of<State.Task, 'params'>): Promise<void>;
}

export interface App<R extends Page.ElemResult = Page.ElemResult> {
    state: State.Core;
    page: Page.Core<R>;
    logger: Logger.Core;
    extern: Extern.Core;
    readonly __config: Config.Core;

    config <K extends keyof Config.Core>(key: K): Promise<Config.Core[K]>;
    act (): Promise<void>;
    sleep (ms: number): Promise<void>;
    execute (task: TASK, params: Of<State.Task, 'params'>): Promise<void>;
    nextTasks (): Promise<void>;
}

