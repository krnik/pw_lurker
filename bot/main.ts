import puppeteer, {Browser} from 'puppeteer';
import type {App, Config, Logger, Extern } from "../core/types";
import {getBotPage} from "./page.js";
import {BotExtern} from "./extern.js";
import {getTask} from "../core/task/task.mod.js";
import {TASK, /* ROUTE */} from "../core/constants.js";
import {BotState} from "./state.js";
import {some} from '../core/utils.js';
import {configuration} from './configuration.js';

export class Bot implements App.Core {
    public state: BotState;
    public extern: Extern.Core;
    public logger: Logger.Core;
    public config: Config.Core;
    public tasks: App.Tasks;

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

                await getTask(task.name).perform(this, task.params as any);
                this.tasks.shift();
            }

            this.logger.info({ msg: 'Bot.act - completed' });
        } catch (error) {
            this.logger.error({
                msg: 'Bot.act - task execution failed, dropping queued tasks',
                tasks: this.tasks,
                error: {
                    message: error.message,
                    stack: error.stack,
                },
            });
            this.tasks = [];
        } finally {
            await this.state.refresh();
            setTimeout(() => this.act(), 1000);
        }
    }

    public async sleep (ms: number): Promise<void> {
        this.logger.info({
            msg: 'Sleeping',
            duration: ms,
        });

        await new Promise((r) => setTimeout(r, ms));
    }

    public execute<T extends TASK> (...[task, params]: App.TaskExecParameters<T>): Promise<void> {
        return new Promise(
            (resolve) => setTimeout(
                () => getTask(task).perform(this, params as any).then(() => resolve())
            )
        );
    }

    addTask<T extends TASK> (...[task, params]: App.TaskExecParameters<T>): void {
        const obj: App.Tasks[number] = { name: task };

        if (params) {
            obj.params = params;
        }

        this.tasks.push(obj);
    }

    async nextTasks (): Promise<void> {
        if (this.tasks.length !== 0) {
            const message = 'You cannot call "nextTasks" method on "State" when "tasks" queue is not empty.';
            throw new Error(message);
        }

        if (!this.state.isLeaderHealthy(this.config['leader.minHealth'])) {
            this.addTask(TASK.HEAL);
            return;
        }

        if (this.state.isPokeboxFull()) {
            this.addTask(TASK.EVOLVE_POKEMONS);
            this.addTask(TASK.SELL_POKEMONS);
            return;
        }

        if (this.state.hasMoneyInPocket()) {
            this.addTask(TASK.BANK_DEPOSIT);
            return;
        }

        if (this.state.ap.current >= this.config['hunt.locationAPCost']) {
            this.addTask(TASK.HUNT);
            return;
        }

        this.addTask(TASK.NO_AP);

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

