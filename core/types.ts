import { TASK, POKEBALLS, HEAL_METHOD, AP_REFILL_METOHD, EVENT } from "./constants";
import { PWResult } from "../inject/error";
import {PokeballThrowCondition, PokemonMoveCondition} from "./schema/condition";

export type None = null | undefined;
export type Some<T> = T;
export type Or<T, Y> = T | Y;
export type Option<T> = Or<Some<T>, None>;
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
    export type HealMethod = typeof HEAL_METHOD[number];
    export type APRefillMethod = typeof AP_REFILL_METOHD[number];

    export type PokeballThrow = {
        pokeballs: (typeof POKEBALLS.ALL[number])[];
        when: PokeballThrowCondition[];
        best: 'chance' | 'quantity';
    };

    export type Core = {
        'user.password': string;
        'user.login': string;
        'bot.workWhileWaiting': boolean;
        'hunt.location': string;
        'hunt.locationAPCost': number;
        'hunt.noAP': APRefillMethod[];
        'hunt.pokeballs': PokeballThrow[];
        'hunt.pokemonPokeboxStore': PokemonMoveCondition[];
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
        getPokeballInfo (): Promise<State.Pokeball[]>;
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
    export type Pokeball = { name: string, chance: number, quantity: number };

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

export namespace Stats {
    type Earnings = {
        total: number;
        prices: number[];
    };

    export type State = {
        hunts: number;
        hunts_failed: number;
        earnings: Earnings;
        pokemons: Record<string, number>;
        pokemons_caught: number;
        pokeballs: Record<string, number>;
        total_pokeballs: number;
        items: Record<string, number>;
    }

    export type Params = {
        [EVENT.SELL_POKEMONS]: [number];
        [EVENT.WAIT]: [];
        [EVENT.DEPOSIT]: [number];
        [EVENT.WITHDRAW]: [number];
        [EVENT.EVOLVE_POKEMONS]: [number];
        [EVENT.HEAL]: [];
        [EVENT.HUNT]: [];
        [EVENT.ENCOUNTER_POKEMON]: [string];
        [EVENT.ENCOUNTER_ITEM]: [string];
        [EVENT.ENCOUNTER_NOTHING]: [];
        [EVENT.THROW_POKEBALL]: [string];
        [EVENT.THROW_SUCCESSFUL]: [];
        [EVENT.THROW_FAILED]: [];
    };

    export interface Core {
        add<E extends EVENT> (event: E, ...args: Params[E]): void;
    }
}

export namespace App {
    type TaskSignatures = {
        [TASK.HEAL]: never;
        [TASK.HUNT]: never;
        [TASK.WAIT]: never;
        [TASK.NO_AP]: never;
        [TASK.BANK_DEPOSIT]: never;
        [TASK.BANK_WITHDRAW]: { amount: number };
        [TASK.SELL_POKEMONS]: never;
        [TASK.EVOLVE_POKEMONS]: never;
    };
    export type TaskImpls<T extends TASK> = {
        name: T;
        perform (app: App.Core, params: TaskSignatures[T]): Promise<void>;
    };
    export type TaskExecParameters<T extends TASK> = TaskSignatures[T] extends never ? [T] : [T, TaskSignatures[T]];
    export type Tasks = { name: TASK, params?: TaskSignatures[TASK] }[];

    export interface Core {
        state: State.Core;
        logger: Logger.Core;
        extern: Extern.Core;
        config: Config.Core;
        tasks: Tasks;
        stats: Stats.Core;

        act (): Promise<void>;
        sleep (ms: number): Promise<void>;
        execute<T extends TASK> (...args: TaskExecParameters<T>): Promise<void>;
        addTask<T extends TASK> (...args: TaskExecParameters<T>): void;
        nextTasks (): Promise<void>;
    }
}
