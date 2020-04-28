import puppeteer, {Browser} from 'puppeteer';
import type {App, Config, Logger, Extern, Of} from "../core/types";
import {getBotPage} from "./page.js";
import {BotExtern} from "./extern.js";
import {getTask} from "../core/task/task.mod.js";
import {TASK, ROUTE} from "../core/constants.js";
import {BotState} from "./state.js";
import {some} from '../core/utils.js';
import {configuration} from './configuration.js';

export class Bot implements App.Core {
    public state: BotState;
    public extern: Extern.Core;
    public logger: Logger.Core;
    public config: Config.Core;
    public tasks: App.Task[];

    private constructor (logger: Logger.Core, extern: BotExtern, state: BotState, config: Config.Core) {
        this.state = state;
        this.logger = logger;
        this.config = config;
        this.extern = extern;
        this.tasks = [];
    }

    public async act (): Promise<void> {
        try {
            await this.nextTasks();
            this.logger.info({
                msg: 'Bot.act - staring',
                nextTasks: this.tasks,
            });

            while (this.tasks.length > 0) {
                const task = some(this.tasks[0]);

                this.logger.debug({
                    msg: 'Bot.act - executing task',
                    task: task.name,
                });

                await getTask(task.name).perform(this, task.params);
                this.tasks.shift();
            }

            this.logger.info({ msg: 'Bot.act - completed' });
        } catch (error) {
            this.logger.error({
                msg: 'Bot.act - task execution failed',
                tasks: this.tasks,
                error,
            });
            await this.extern.ensurePathname(ROUTE.START);
            // TODO: Should it drop the taks or try to repeat the action?
            this.tasks = [];
        } finally {
            await this.state.refresh();
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

        if (this.state.ap.current >= this.config['hunt.locationAPCost']) {
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

    public static async create (browser: Browser): Promise<Bot> {
        const accounts = configuration.accounts;

        const index = some(process.argv.findIndex((arg) => arg === '-a'));
        const acc = some(process.argv[index + 1]);
        const config = some(accounts.find((config) => config['user.login'].toLowerCase() === acc.toLowerCase()));

        const page = await getBotPage(browser, config);
        const extern = new BotExtern(page);
        const state = await BotState.create(extern, config);

        return new Bot(page.logger, extern, state, config);
    }
}

async function start () {
    const headless = process.argv.indexOf('-w') === -1;
    const browser = await puppeteer.launch({
        headless,
        devtools: true,
        defaultViewport: { width: 1200, height: 650 }
    });

    await Bot.create(browser).then((bot) => {
        bot.logger.info({ msg: 'Initialized bot instance' });
        return bot.act();
    });
}

start();

