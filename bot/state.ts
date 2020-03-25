import type { State } from "../core/types";
import {ROUTE} from "../core/constants.js";
import {BotPage} from "./page.js";
import {toNumber, toMoneyAmount, some} from "../core/utils.js";

type StatePiece<K extends keyof State.Core> = Promise<Pick<State.Core, K>>;

export class BotState implements State.Core {
    public page: BotPage;
    public actionPointsCount: number;
    public maxActionPoinsCount: number;
    public maxPokemonCount: number;
    public pokemonCount: number;
    public team: State.Team;
    public tasks: State.Task[];
    public moneyAmount: number;

    constructor (page: BotPage, data: Omit<State.Core, 'nextTasks'>) {
        this.page = page;
        this.maxActionPoinsCount = data.maxActionPoinsCount;
        this.actionPointsCount = data.actionPointsCount;
        this.maxPokemonCount = data.maxPokemonCount;
        this.pokemonCount = data.pokemonCount;
        this.team = data.team;
        this.moneyAmount = data.moneyAmount;
        this.tasks = data.tasks;
    }

    public isPokeboxFull (): boolean {
        return this.pokemonCount >= this.maxPokemonCount;
    }

    public hasMoneyInPocket (): boolean {
        return this.moneyAmount > 1000;
    }

    public isLeaderHealthy (threshold: number): boolean {
        return this.team.leader.hp >= threshold;
    }

    public static async create (page: BotPage): Promise<BotState> {
        await page.ensurePath(ROUTE.TEAM);

        const [money, team, pokeCount, ap] = await Promise.all([
            BotState.getMoneyInfo(page),
            BotState.getTeamInfo(page),
            BotState.getPokemonCountInfo(page),
            BotState.getAPInfo(page),
        ]);

        return new BotState(page, { ...money, ...team, ...pokeCount, ...ap, tasks: [] });
    }

    private static async getAPInfo (page: BotPage): StatePiece<'maxActionPoinsCount' | 'actionPointsCount'> {
        const AP = '#action_points_count';
        const MAX_AP = '#max_action_points_count';

        const [actionPointsCount, maxActionPoinsCount] = await Promise.all([
            page.getText(AP).then(toNumber),
            page.getText(MAX_AP).then(toNumber),
        ]);

        return { actionPointsCount, maxActionPoinsCount };
    }

    private static async getMoneyInfo (page: BotPage): StatePiece<'moneyAmount'> {
        const AMOUNT = '#money';

        return {
            moneyAmount: await page.getText(AMOUNT).then(toMoneyAmount),
        };
    }

    private static async getPokemonCountInfo (page: BotPage): StatePiece<'pokemonCount' | 'maxPokemonCount'> {
        const COUNT = '.rezerwa-count';
        const MAX_COUNT = '#bottom_bar .rezerwa_info';

        const [pokemonCount, maxInfo] = await Promise.all([
            page.getText(COUNT).then(toNumber),
            page.getText(MAX_COUNT),
        ]);

        const maxPokemonCount = toNumber(
            maxInfo
                .split('/', 2)[1]
                .trim()
        );

        return { pokemonCount, maxPokemonCount };
    }

    private static async getTeamInfo (page: BotPage): StatePiece<'team'> {
        const SELECTOR = '#lista-druzyna .box.light-blue.round.poke-team-box';
        const elements = await page.$$(SELECTOR);

        if (elements.length === 0) {
            throw new Error('Pokemon elements empty');
        }

        return await Promise
            .all(
                elements.map((elem): Promise<State.Pokemon> => Promise
                    .all([
                        elem.evaluate((e) => e.classList.contains('leader')),
                        elem.evaluate((e) => e.getAttribute('poke_id')).then(toNumber),
                        page.getText('.team-lvl').then(toNumber),
                        page.getText('.team-hp').then((text) => text.split('/', 2).map(toNumber)),
                    ])
                    .then(([leader, id, level, health]) => ({
                        leader,
                        id,
                        level,
                        hp: health[0],
                        maxHP: health[1],
                    })))
            )
            .then((pokemons) => ({
                team: {
                    team: pokemons,
                    leader: some(pokemons.find((pokemon) => pokemon.leader)),
                }
            }));
    }

    private static async getAvailableLocations (page: BotPage): Promise<{ name: string, text: string }[]> {
        return await page
            .getAttrs('.location a', 'title')
            .then((attrs) => attrs
                .map(some)
                .map((text) => ({
                    text, 
                    name: text
                        .toLowerCase()
                        .replace(/poluj\s+w/g, '')
                        .trim()
                        .replace(/\s/g, '-'),
                })));
    }
}
