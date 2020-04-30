import { Extern, State, Logger } from "../core/types";
import {BotPage} from "./page";
import {PWResult} from "../inject/error";

export class BotExtern implements Extern.Core {
    private static waitForNavigation (_prototype: any, _name: string, descriptor: any) {
        const original = descriptor.value;

        descriptor.value = async function navigationDecorated (this: BotExtern, ...args: any[]): Promise<any> {
            return await Promise.all([
                this.page.waitForNavigation(),
                original.call(this, ...args),
            ]);
        };
    }

    private static trace (_prototype: any, _name: string, descriptor: any) {
        const original = descriptor.value;
        
        descriptor.value = async function traceDecorated (this: BotExtern, ...args: any[]): Promise<any> {
            const started = Date.now();
            const result = await original.call(this, ...args);

            this.logger.trace({
                args,
                function: `BotExtern.${original.name}`,
                duration: Date.now() - started,
            });

            return result;
        };
    }

    public page: BotPage;
    public logger: Logger.Core;
    
    public constructor (page: BotPage) {
        this.page = page;
        this.logger = page.logger;
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

    @BotExtern.trace
    public async getAPInfo (): Promise<State.AP> {
        return await this.unwrapResult(this.page.evaluate(() => window.getAPInfo()));
    }

    @BotExtern.trace
    public async getPokemonCountInfo(): Promise<State.Reserve> {
        return await this.unwrapResult(this.page.evaluate(() => window.getPokemonCountInfo()));
    }

    @BotExtern.trace
    public async getAvailableLocations (): Promise<State.Loc[]> {
        return await this.unwrapResult(this.page.evaluate(() => window.getAvailableLocations()));
    }

    @BotExtern.trace
    public async getTeamInfo (): Promise<State.Pokemon[]> {
        return await this.unwrapResult(this.page.evaluate(() => window.getTeamInfo()));
    }

    @BotExtern.trace
    public async getLeaderHP (): Promise<State.HP> {
        return await this.unwrapResult(this.page.evaluate(() => window.getLeaderHP()));
    }

    @BotExtern.trace
    public async getMoneyInfo(): Promise<number> {
        return await this.unwrapResult(this.page.evaluate(() => window.getMoneyInfo()));
    }

    @BotExtern.trace
    public async evaluateResult<T, A extends any[]> (fn: (...args: A) => PWResult<T>, ...args: A): Promise<T> {
        return await this.unwrapResult(this.page.evaluate<() => PWResult<T>>(fn as any, ...args));
    }

    @BotExtern.trace
    public async evaluate<T, A extends any[]> (fn: (...args: A) => T, ...args: A): Promise<T> {
        return await (this.page.evaluate(fn as any, ...args) as Promise<T>);
    }

    @BotExtern.trace
    public async getText (selector: string): Promise<string> {
        return await this.unwrapResult(this.page.evaluate((sel: string) => window.getText(sel), selector));
    }

    @BotExtern.trace
    public async evolve (pokemonId: number): Promise<void> {
        await this.unwrapResult(this.page.evaluate((id: number) => window.evolve(id), pokemonId));
    }

    @BotExtern.trace
    public async evolveAdvanced (pokemonId: number, nextFormId: number): Promise<void> {
        await this.unwrapResult(
            this.page.evaluate((id: number, nextId: number) => window.evolveAdvanced(id, nextId), pokemonId, nextFormId)
        );
    }

    @BotExtern.trace
    public async moveToPokebox(pokemonId: number): Promise<void> {
        await this.unwrapResult(
            this.page.evaluate((id: number) => window.moveToPokebox(id), pokemonId)
        );
    }

    @BotExtern.trace
    public async getReservePokemons (): Promise<State.ReservePokemon[]> {
        return await this.unwrapResult(this.page.evaluate(() => window.getReservePokemons()));
    }

    @BotExtern.trace
    public async getEncounterPokemonInfo (): Promise<State.EncounterPokemon> {
        return await this.unwrapResult(this.page.evaluate(() => window.getEncounterPokemonInfo()));
    }

    @BotExtern.trace
    public async getPokeballInfo (): Promise<State.Pokeball[]> {
        return await this.unwrapResult(this.page.evaluate(() => window.getPokeballInfo()));
    }

    @BotExtern.trace
    public async setPanelTabToTeam (): Promise<void> {
        await this.unwrapResult(this.page.evaluate(() => window.setPanelTabToTeam()));
    }

    @BotExtern.trace
    public async type (selector:string, text: string): Promise<void> {
        return await this.page.type(selector, text);
    }

    @BotExtern.trace
    public async click (selector: string): Promise<void> {
        return await this.page.click(selector);
    }

    @BotExtern.trace
    @BotExtern.waitForNavigation
    public async clickAndNavigate (selector: string): Promise<void> {
        return await this.click(selector);
    }

    @BotExtern.trace
    @BotExtern.waitForNavigation
    public async submitAndNavigate (formName: string): Promise<void> {
        await this.unwrapResult(this.page.evaluate((form: string) => window.submit(form), formName));
    }

    @BotExtern.trace
    public async getPathname (): Promise<string> {
        return this.page.evaluate(() => window.location.pathname);
    }

    @BotExtern.trace
    @BotExtern.waitForNavigation
    public async setPathname (pathname: string): Promise<void> {
        return await this.page.evaluate((path: string) => {
            window.location.pathname = path;
        }, pathname);
    }

    @BotExtern.trace
    public async ensurePathname (pathname: string): Promise<void> {
        const current = await this.getPathname();
        if (current !== pathname) {
            await this.setPathname(pathname);
        }
    }

    @BotExtern.trace
    @BotExtern.waitForNavigation
    public async reload (): Promise<void> {
        return await this.page.evaluate(() => {
            window.location.reload();
        });
    }
}

