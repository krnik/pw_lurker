// @ts-ignore
import puppeteer, * as P from 'puppeteer';
import type {App, Page, State, Config, Logger, Extern, Of} from "../core/types";
import {BotPage, getBotPages} from "./page.js";
import {BotExtern} from "./extern.js";
import {getTask} from "../core/task/task.mod.js";
import {TASK} from "../core/constants.js";
import {BotState} from "./state.js";
import {some} from '../core/utils.js';

const p: typeof P = puppeteer;

export class Bot implements App<Page.Handle> {
    public state: BotState;
    public extern: Extern.Core;
    public page: BotPage;
    public logger: Logger.Core;
    public __config: Config.Core;

    private constructor (page: BotPage, state: BotState, config: Config.Core) {
        this.page = page;
        this.state = state;
        this.logger = page.logger;
        this.__config = config;
        this.extern = new BotExtern(page);
    }

    public async act (): Promise<void> {
        await this.nextTasks();

        while (this.state.tasks.length > 0) {
            const task = some(this.state.tasks.shift());

            this.logger.info({
                msg: 'Executing task',
                task: task.name,
            });

            await getTask(task.name).perform(this, task.params);
            await this.state.update();
        }

        this.logger.info({ msg: 'All tasks performed' });

        setTimeout(() => this.act(), 1000);
    }

    public async config <K extends keyof Config.Core>(key: K): Promise<Config.Core[K]> {
        return this.__config[key];
    }

    public async sleep (ms: number): Promise<void> {
        await new Promise((r) => setTimeout(r, ms));
    }

    public execute (task: TASK, params: Of<State.Task, 'params'>): Promise<void> {
        return new Promise(
            (resolve) => setTimeout(
                () => getTask(task).perform(this, params).then(() => resolve())
            )
        );
    }

    public static async create (browser: P.Browser): Promise<Bot[]> {
        const pages = await getBotPages(browser);

        return Promise.all(pages.map(async (page) => {
            const state = await BotState.create(page);
             
            return new Bot(page, state, page.__config);
        }));
    }

    async nextTasks (): Promise<void> {
        if (this.state.tasks.length !== 0) {
            const message = 'You cannot call "nextTasks" method on "State" when "tasks" queue is not empty.';
            throw new Error(message);
        }

        if (!this.state.isLeaderHealthy(await this.config('leader.minHealth'))) {
            this.state.tasks = [{
                name: TASK.HEAL,
                params: {},
            }];
            return;
        }

        if (this.state.isPokeboxFull()) {
            this.state.tasks = [
                {
                    name: TASK.EVOLVE_POKEMONS,
                    params: {},
                },
                {
                    name: TASK.SELL_POKEMONS,
                    params: {},
                },
            ];
            return;
        }

        if (this.state.hasMoneyInPocket()) {
            this.state.tasks = [{
                name: TASK.BANK_DEPOSIT,
                params: {},
            }];
            return;
        }

        if (this.state.actionPointsCount >= await this.config('hunt.locationPACost')) {
            this.state.tasks = [{
                name: TASK.HUNT,
                params: {},
            }];
            return;
        }

        this.state.tasks = [{
            name: TASK.WAIT,
            params: {},
        }];
    }

}

async function start () {
    const browser = await p.launch({
        headless: process.env.PW_BOT_HEADLESS === 'true',
        devtools: true,
        defaultViewport: { width: 1200, height: 650 }
    });

    const bots = await Bot.create(browser);

    return bots.map((bot) => bot.act());
}

start();

