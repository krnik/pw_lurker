import { Page, ElementHandle } from "puppeteer";
import { TASK, POKEBALL } from "./constants";

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
        warn: LogFn;
        fatal: LogFn;
    }
}

export namespace Config {
    export type HealMethod = ('juice' | 'money' | 'herb' | 'wait'); 
    export type NoAPBehaviour = ('oak' | 'junipier' | 'wait');
    export type PokeballCondition = ('starter' | 'shiny' | 'always' | 'name' | 'type');
    export type PokeballThrowInfo = {
        when: PokeballCondition,
        eq?: string[];
        name: POKEBALL,
    };

    export type Core = {
        'user.password': string;
        'user.login': string;
        'bot.workWhileWaiting': boolean;
        'hunt.location': string;
        'hunt.locationAPCost': number;
        'hunt.noAP': NoAPBehaviour;
        'hunt.pokeballs': PokeballThrowInfo[];
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
        getElems (selector: string): Promise<R[]>;
        getText (selector: string): Promise<string>;
        getAttr (selector: string, attrName: string): Promise<Option<string>>;
        getAttrs (selector: string, attrName: string): Promise<Option<string>[]>;
        click (selector: string): Promise<void>;
        type (selector: string, text: string): Promise<void>;
        submitNavigate (formName: string): Promise<void>;
        clickNavigate (selector: string): Promise<void>;
        currentUrl (): Promise<string>;
        ensurePath (path: string): Promise<void>;
        reload (): Promise<void>;
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

    export type Location = {
        name: string;
        text: string;
    };

    export interface Core {
        actionPointsCount: number;
        maxActionPoinsCount: number;
        pokemonCount: number;
        maxPokemonCount: number;
        moneyAmount: number;
        leader: Pokemon;
        team: Pokemon[];
        location: Location;
        locations: Location[];

        refresh (): Promise<void>;
    };
}

export interface Task<R extends Page.ElemResult = Page.ElemResult> {
    name: TASK;

    perform (app: App.Core<R>, params?: Of<App.Task, 'params'>): Promise<void>;
}

export namespace App {
    export type Task = {
        name: TASK;
        params: { [k: string]: Or<number, string> };
    };

    export interface Core<R extends Page.ElemResult = Page.ElemResult> {
        state: State.Core;
        page: Page.Core<R>;
        logger: Logger.Core;
        extern: Extern.Core;
        config: Config.Core;
        tasks: Task[];

        act (): Promise<void>;
        sleep (ms: number): Promise<void>;
        execute (task: TASK, params: Of<Task, 'params'>): Promise<void>;
        nextTasks (): Promise<void>;
    }
}
