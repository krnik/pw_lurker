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

    public page: BotPage;
    
    public constructor (page: BotPage) {
        this.page = page;
    }

    public async unwrapResult<T>(promise: Promise<PWResult<T>>): Promise<T> {
        const result = (await promise) as unknown as { ok: T | null, err: null | object };
        if (typeof result !== 'object' || result === null) {
            throw new Error('Expected Result object');
        }
        if (result.ok === null) {
            throw result.err;
        }
        return result.ok;
    }

    public async getAPInfo (): Promise<State.AP> {
        return await this.unwrapResult(this.page.evaluate(() => window.getAPInfo()));
    }

    public async getPokemonCountInfo(): Promise<State.Reserve> {
        return await this.unwrapResult(this.page.evaluate(() => window.getPokemonCountInfo()));
    }

    public async getAvailableLocations (): Promise<State.Loc[]> {
        return await this.unwrapResult(this.page.evaluate(() => window.getAvailableLocations()));
    }

    public async getTeamInfo (): Promise<State.Pokemon[]> {
        return await this.unwrapResult(this.page.evaluate(() => window.getTeamInfo()));
    }

    public async getLeaderHP (): Promise<State.HP> {
        return await this.unwrapResult(this.page.evaluate(() => window.getLeaderHP()));
    }

    public async getMoneyInfo(): Promise<number> {
        return await this.unwrapResult(this.page.evaluate(() => window.getMoneyInfo()));
    }

    public async evaluateResult<T, A extends any[]> (fn: (...args: A) => PWResult<T>, ...args: A): Promise<T> {
        return await this.unwrapResult(this.page.evaluate<() => PWResult<T>>(fn as any, ...args));
    }

    public async evaluate<T, A extends any[]> (fn: (...args: A) => T, ...args: A): Promise<T> {
        return await (this.page.evaluate(fn as any, ...args) as Promise<T>);
    }

    public async getText (selector: string): Promise<string> {
        return await this.unwrapResult(this.page.evaluate((sel: string) => window.getText(sel), selector));
    }

    public async evolve (pokemonId: number): Promise<void> {
        await this.unwrapResult(this.page.evaluate((id: number) => window.evolve(id), pokemonId));
    }

    public async evolveAdvanced (pokemonId: number, nextFormId: number): Promise<void> {
        await this.unwrapResult(
            this.page.evaluate((id: number, nextId: number) => window.evolveAdvanced(id, nextId), pokemonId, nextFormId)
        );
    }

    public async moveToPokebox(pokemonId: number): Promise<void> {
        await this.unwrapResult(
            this.page.evaluate((id: number) => window.moveToPokebox(id), pokemonId)
        );
    }

    public async getReservePokemons (): Promise<State.ReservePokemon[]> {
        return await this.unwrapResult(this.page.evaluate(() => window.getReservePokemons()));
    }

    public async getEncounterPokemonInfo (): Promise<State.EncounterPokemon> {
        return await this.unwrapResult(this.page.evaluate(() => window.getEncounterPokemonInfo()));
    }

    public async setPanelTabToTeam (): Promise<void> {
        await this.unwrapResult(this.page.evaluate(() => window.setPanelTabToTeam()));
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
    public async submitAndNavigate (formName: string): Promise<void> {
        await this.unwrapResult(this.page.evaluate((form: string) => window.submit(form), formName));
    }

    public async getPathname (): Promise<string> {
        return this.page.evaluate(() => window.location.pathname);
    }

    @BotExtern.waitForNavigation
    public async setPathname (pathname: string): Promise<void> {
        return await this.page.evaluate((path: string) => {
            window.location.pathname = path;
        }, pathname);
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
