import { Extern, State } from "../core/types";
import {BotPage} from "./page";
import {PWResult} from "../inject/error";

export class BotExtern implements Extern.Core {
    private static waitForNavigation (prototype: any, name: string) {
        const original = prototype[name];
        return {
            async value (this: BotExtern, ...args: any[]): Promise<void> {
                await Promise.all([
                    this.page.waitForNavigation(),
                    original.call(this, ...args),
                ]);
            }
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

    @BotExtern.unwrapResult
    public async evaluateResult<T, A extends any[]> (fn: (...args: A) => PWResult<T>, ...args: A): Promise<T> {
        return await this.page.evaluate(fn, ...args);
    }

    public async evaluate<T, A extends any[]> (fn: (...args: A) => T, ...args: A): Promise<T> {
        return await this.page.evaluate(fn, ...args);
    }

    @BotExtern.unwrapResult
    public async getText (selector: string): Promise<string> {
        return await this.page.evaluate((sel: string) => window.getText(sel), selector);
    }

    @BotExtern.unwrapResult
    public async evolve (pokemonId: number): Promise<void> {
        return await this.page.evaluate((id: number) => window.evolve(id), pokemonId);
    }

    @BotExtern.unwrapResult
    public async evolveAdvanced (pokemonId: number, nextFormId: number): Promise<void> {
        return await this.page.evaluate((id: number, nextId: number) => window.evolveAdvanced(id, nextId), pokemonId, nextFormId);
    }

    @BotExtern.unwrapResult
    public async moveToPokebox(pokemonId: number): Promise<void> {
        return await this.page.evaluate((id: number) => window.moveToPokebox(id), pokemonId);
    }

    @BotExtern.unwrapResult
    public async getReservePokemons (): Promise<State.ReservePokemon[]> {
        return await this.page.evaluate(() => window.getReservePokemons());
    }

    @BotExtern.unwrapResult
    public async getEncounterPokemonInfo (): Promise<State.EncounterPokemon> {
        return await this.page.evaluate(() => window.getEncounterPokemonInfo());
    }

    @BotExtern.unwrapResult
    public async setPanelTabToTeam (): Promise<void> {
        return await this.page.evaluate(() => window.setPanelTabToTeam());
    }

    public async type (selector:string, text: string): Promise<void> {
        return await this.page.type(selector, text);
    }

    public async click (selector: string): Promise<void> {
        return await this.page.click(selector);
    }

    @BotExtern.waitForNavigation
    public async clickAndNavigate (selector: string): Promise<void> {
        return this.click(selector);
    }

    @BotExtern.waitForNavigation
    @BotExtern.unwrapResult
    public async submitAndNavigate (formName: string): Promise<void> {
        return this.page.evaluate((form: string) => window.submit(form), formName);
    }

    public async getPathname (): Promise<string> {
        return this.page.evaluate(() => window.location.pathname);
    }

    @BotExtern.waitForNavigation
    public async setPathname (pathname: string): Promise<void> {
        return this.page.evaluate((path: string) => window.location.pathname = path, pathname);
    }

    public async ensurePathname (pathname: string): Promise<void> {
        const current = await this.getPathname();
        if (current !== pathname) {
            await this.setPathname(pathname);
        }
    }

    @BotExtern.waitForNavigation
    public async reload (): Promise<void> {
        return await this.page.evaluate(() => {
            window.location.reload();
        });
    }
}
