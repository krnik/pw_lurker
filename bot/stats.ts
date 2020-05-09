import { Stats, Config, Option } from "../core/types";
import { resolveRoot } from "../core/paths";
import { STATS_DIR_NAME, EVENT, JOURNAL_DIR_NAME } from "../core/constants";
import { existsSync, writeFileSync, readFileSync, appendFileSync } from "fs";

function zeroPad (num: number, len: number): string {
    return num.toString().padStart(len, '0');
}

export class BotStats implements Stats.Core {
    private state: Stats.State;
    private timeout: Option<NodeJS.Timeout>;
    private statsPath: string;
    private messages: string[];
    private journalDirPath: string;

    constructor (config: Config.Core) {
        this.messages = [];
        this.timeout = null;

        this.journalDirPath = resolveRoot([
            JOURNAL_DIR_NAME,
            config['user.login'],
        ]);

        const filePath = resolveRoot([
            STATS_DIR_NAME,
            config['user.login'],
            config['hunt.location'],
        ]);

        this.statsPath = filePath;
        if (!existsSync(filePath)) {
            this.state = {
                hunts: 0,
                hunts_failed: 0,
                earnings: {
                    total: 0,
                    prices: [],
                },
                items: {},
                pokemons: {},
                pokemons_caught: 0,
                pokeballs: {},
                total_pokeballs: 0,
            };

            writeFileSync(filePath, JSON.stringify(this.state, undefined, 2));
        } else {
            this.state = JSON.parse(readFileSync(filePath).toString());
        }
    }

    add<E extends EVENT>(event: E, ...params: Stats.Params[E]): void {
        switch (event) {
            case EVENT.SELL_POKEMONS:
                const [price] = (params as Stats.Params[EVENT.SELL_POKEMONS]);
                this.state.earnings.prices.push(price);
                this.state.earnings.total += price;
                this.addMessage(`Selling pokemons for ${price}.`);
                break;

            case EVENT.WAIT:
                this.addMessage('Waiting.');
                break;
        
            case EVENT.DEPOSIT:
                this.addMessage(`Deposit ${params[0]}.`);
                break;

            case EVENT.WITHDRAW:
                this.addMessage(`Withdraw ${params[0]}.`);
                break;
            
            case EVENT.EVOLVE_POKEMONS:
                const [count] = (params as Stats.Params[EVENT.EVOLVE_POKEMONS]);
                this.addMessage(`Evolved pokemons ${count} times.`);
                break;

            case EVENT.HEAL:
                this.addMessage('Healed leader.');
                break;

            case EVENT.HUNT:
                this.state.hunts += 1;
                this.addMessage(`Hunt in ${params[0]}.`);
                break;

            case EVENT.ENCOUNTER_POKEMON:
                const [pokemon] = (params as Stats.Params[EVENT.ENCOUNTER_POKEMON]);

                if (this.state.pokemons[pokemon]) {
                    this.state.pokemons[pokemon] += 1;
                } else {
                    this.state.pokemons[pokemon] = 1;
                }

                this.addMessage(`Encountered pokemon ${pokemon}!`);
                break;

            case EVENT.ENCOUNTER_ITEM:
                const [item] = (params as Stats.Params[EVENT.ENCOUNTER_ITEM]);

                if (this.state.items[item]) {
                    this.state.items[item] += 1;
                } else {
                    this.state.items[item] = 1;
                }
                break;

            case EVENT.ENCOUNTER_NOTHING:
                this.state.hunts_failed += 1;
                this.addMessage('No encounter.');
                break;

            case EVENT.THROW_POKEBALL:
                const [pokeball] = (params as Stats.Params[EVENT.THROW_POKEBALL]);

                this.state.total_pokeballs += 1;
                if (this.state.pokeballs[pokeball]) {
                    this.state.pokeballs[pokeball] += 1;
                } else {
                    this.state.pokeballs[pokeball] = 1;
                }

                this.addMessage(`Throwing ${pokeball}.`);
                break;

            case EVENT.THROW_SUCCESSFUL:
                this.state.pokemons_caught += 1;
                this.addMessage(`Caught ${params[0]}.`);
                break;
        }

        this.scheduleWrite();
    }

    private addMessage (message: string): void {
        const now = new Date();
        const timestamp = `[${zeroPad(now.getHours(), 2)}:${zeroPad(now.getMinutes(), 2)}]`;
        this.messages.push(`${timestamp} ${message}`);
    }

    private scheduleWrite(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        if (this.messages.length > 100) {
            this.flush();
        }

        this.timeout = setTimeout(() => this.flush(), 5000);
    }

    private flush () {
        writeFileSync(this.statsPath, JSON.stringify(this.state, undefined, 2));

        if (this.messages.length > 0) {
            appendFileSync(this.getJournalFilePath(), this.messages.join('\n') + '\n');
        }

        this.messages = [];
    }

    private getJournalFilePath() {
        const now = new Date();
        const fname = `${now.getFullYear()}_${zeroPad(now.getMonth() + 1, 2)}_${zeroPad(now.getDate(), 2)}.log`;
        const path = resolveRoot([
            this.journalDirPath,
            fname,
        ]);

        if (existsSync(path)) 
            return path;

        writeFileSync(path, '');
        
        return path;
    }
}
