// @ts-ignore
import puppeteer, * as P from 'puppeteer';
import type {App, Page, Config, Logger, Extern, Of} from "../core/types";
import {BotPage, getBotPage} from "./page.js";
import {BotExtern} from "./extern.js";
import {getTask} from "../core/task/task.mod.js";
import {TASK} from "../core/constants.js";
import {BotState} from "./state.js";
import {some} from '../core/utils.js';
import {configuration} from './configuration.js';

const p: typeof P = puppeteer;

export class Bot implements App.Core<Page.Handle> {
    public state: BotState;
    public extern: Extern.Core;
    public page: BotPage;
    public logger: Logger.Core;
    public config: Config.Core;
    public tasks: App.Task[];

    private constructor (page: BotPage, state: BotState, config: Config.Core) {
        this.page = page;
        this.state = state;
        this.logger = page.logger;
        this.config = config;
        this.extern = new BotExtern(page);
        this.tasks = [];

        if (!state.locations.some((loc) => loc.name === config['hunt.location'])) {
            const message = `Cannot find the location "${config['hunt.location']}" set in the "bot.location" config`;
            throw new Error(message);
        }
    }

    public async act (): Promise<void> {
        try {
            await this.nextTasks();

            while (this.tasks.length > 0) {
                const task = some(this.tasks[0]);

                this.logger.info({
                    msg: 'Executing task',
                    task: task.name,
                });

                await getTask(task.name).perform(this, task.params);
                await this.state.refresh();
            }

            this.tasks.shift();
            this.logger.info({ msg: 'All tasks performed' });
        } catch (error) {
            this.logger.error({
                msg: 'Task execution failed',
                tasks: this.tasks,
            });
        } finally {
            setTimeout(() => this.act(), 1000);
        }
    }

    public async sleep (ms: number): Promise<void> {
        await new Promise((r) => setTimeout(r, ms));
    }

    public execute (task: TASK, params: Of<App.Task, 'params'>): Promise<void> {
        return new Promise(
            (resolve) => setTimeout(
                () => getTask(task).perform(this, params).then(() => resolve())
            )
        );
    }

    async nextTasks (): Promise<void> {
        if (this.tasks.length !== 0) {
            const message = 'You cannot call "nextTasks" method on "State" when "tasks" queue is not empty.';
            throw new Error(message);
        }

        if (!this.state.isLeaderHealthy(this.config['leader.minHealth'])) {
            this.tasks = [{
                name: TASK.HEAL,
                params: {},
            }];
            return;
        }

        if (this.state.isPokeboxFull()) {
            this.tasks = [
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
            this.tasks = [{
                name: TASK.BANK_DEPOSIT,
                params: {},
            }];
            return;
        }

        if (this.state.actionPointsCount >= this.config['hunt.locationAPCost']) {
            this.tasks = [{
                name: TASK.HUNT,
                params: {},
            }];
            return;
        }

        this.tasks = [{
            name: TASK.NO_AP,
            params: {},
        }];

        return;
    }

    public static async create (browser: P.Browser): Promise<Bot> {
        const accounts = configuration.accounts;

        const index = some(process.argv.findIndex((arg) => arg === '-a'));
        const acc = some(process.argv[index + 1]);
        const config = some(accounts.find((config) => config['user.login'].toLowerCase() === acc.toLowerCase()));

        const page = await getBotPage(browser, config);
        const state = await BotState.create(page, config);

        return new Bot(page, state, config);
    }
}

async function start () {
    const headless = process.argv.indexOf('-w') === -1;
    const browser = await p.launch({
        headless,
        defaultViewport: { width: 1200, height: 650 }
    });

    await Bot.create(browser).then((bot) => bot.act());
}

start();

