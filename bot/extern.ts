import { Extern, State } from "../core/types";
import {BotPage} from "./page";

export class BotExtern implements Extern.Core {
    private static waitForNavigation (prototype: any, name: string) {
        const original = prototype[name];
        return async function (this: BotExtern, ...args: any[]) {
            return await Promise.all([
                this.page.waitForNavigation(),
                original.call(this, ...args),
            ]);
        };
    }

    private static unwrapResult (prototype: any, name: string) {
        const original = prototype[name];
        return {
            async value (this: BotExtern, ...args: any[]) {
                const result = await original.call(this, ...args);
                if (typeof result !== 'object' || result === null) {
                    throw new Error('Expected Result object');
                }
                if (result.ok === null) {
                    throw result.err;
                }
                return result.ok;
            }
        };
    }

    public page: BotPage;
    
    public constructor (page: BotPage) {
        this.page = page;
    }

    @BotExtern.unwrapResult
    public async getAPInfo (): Promise<State.AP> {
        return await this.page.evaluate(() => window.getAPInfo());
    }

    @BotExtern.unwrapResult
    public async getPokemonCountInfo(): Promise<State.Reserve> {
        return await this.page.evaluate(() => window.getPokemonCountInfo());
    }

    @BotExtern.unwrapResult
    public async getAvailableLocations (): Promise<State.Loc[]> {
        return await this.page.evaluate(() => window.getAvailableLocations());
    }

    @BotExtern.unwrapResult
    public async getTeamInfo (): Promise<State.Pokemon[]> {
        return await this.page.evaluate(() => window.getTeamInfo());
    }

    @BotExtern.unwrapResult
    public async getLeaderHP (): Promise<State.HP> {
        return await this.page.evaluate(() => window.getLeaderHP());
    }

    @BotExtern.unwrapResult
    public async getMoneyInfo(): Promise<number> {
        return await this.page.evaluate(() => window.getMoneyInfo());
    }

    public async evaluate<T> (fn: () => T): Promise<T> {
        return await this.page.evaluate(fn);
    }

    @BotExtern.unwrapResult
    public async evolve (pokemonId: number): Promise<void> {
        return await this.page.evaluate((id: number) => window.evolve(id), pokemonId);
    }

    @BotExtern.unwrapResult
    public async evolveAdvanced (pokemonId: number, nextFormId: number): Promise<void> {
        return await this.page.evaluate((id: number, nextId: number) => window.evolveAdvanced(id, nextId), pokemonId, nextFormId);
    }
}
