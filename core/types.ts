import { TASK, POKEBALL } from "./constants";
import {PWResult} from "../inject/error";

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
    export interface Core {
        getAPInfo (): Promise<State.AP>;
        getPokemonCountInfo (): Promise<State.Reserve>;
        getAvailableLocations (): Promise<State.Loc[]>;
        getLeaderHP (): Promise<State.HP>;
        getTeamInfo (): Promise<State.Pokemon[]>;
        getMoneyInfo (): Promise<number>;
        getText (selector: string): Promise<string>;
        evaluateResult<T, A extends any[]> (fn: (...args: A) => PWResult<T>, ...args: A): Promise<T>;
        evaluate<T, A extends any[]> (fn: (...args: A) => T, ...args: A): Promise<T>;
        evolve (pokemonId: number): Promise<void>;
        evolveAdvanced (pokemonId: number, formId: number): Promise<void>;
        moveToPokebox (pokemonId: number): Promise<void>;
        getReservePokemons (): Promise<State.ReservePokemon[]>;
        getEncounterPokemonInfo (): Promise<State.EncounterPokemon>;
        setPanelTabToTeam (): Promise<void>;
        type (selector: string, value: string): Promise<void>;
        click (selector: string): Promise<void>;
        clickAndNavigate (selector: string): Promise<void>;
        submitAndNavigate (formName: string): Promise<void>;
        getPathname (pathname: string): Promise<string>;
        setPathname (pathname: string): Promise<void>;
        ensurePathname (pathname: string): Promise<void>;
        reload (): Promise<void>;
    };
}

export namespace State {
    export type Reserve = { current: number, max: number };
    export type AP = { current: number, max: number };
    export type Loc = { original: string, name: string };
    export type HP = { current: number, max: number };
    export type Pokemon = { name: string, leader: boolean, level: number, id: number, hp: HP };
    export type ReservePokemon = { name: string, level: number, id: number, canEvolve: boolean };
    export type EncounterPokemon = { name: string, level: number, items: string[], types: string[] };

    export interface Core {
        reserve: Reserve;
        ap: AP;
        location: Loc;
        locations: Loc[];
        leader: Pokemon;
        team: Pokemon[];
        money: number;

        /* Function that mutates its invocation context so that the state reflects the state presented on the website. */
        refresh (): Promise<void>;
    };
}

export interface Task {
    name: TASK;

    perform (app: App.Core, params?: Of<App.Task, 'params'>): Promise<void>;
}

export namespace App {
    export type Task = {
        name: TASK;
        params: { [k: string]: Or<number, string> };
    };

    export interface Core {
        state: State.Core;
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
