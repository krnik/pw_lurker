import type { Page } from "../page";
import { toNumber, some, toMoneyAmount } from "../utils.js";
import {Option, Route} from "../types.js";

type Pokemon = {
    maxHP: number;
    hp: number;
    level: number;
    id: number;
    leader: boolean;
};

class Team {
    leader: Pokemon;
    team: Pokemon[];
    fightingPokemon: Option<Pokemon>;

    constructor (pokemons: Pokemon[]) {
        this.leader = some(pokemons.find((p) => p.leader) || null);
        this.team = pokemons;
        this.fightingPokemon = null;
    }
}

type EnvironmentState = {
    actionPointsCount: number;
    maxActionPoinsCount: number;
    pokemonCount: number;
    maxPokemonCount: number;
    moneyAmount: number;
    team: Team;
    moneyToWithdraw: Option<number>;
};

async function getTeamInfo (page: Page): Promise<Team> {
    await page.ensurePath(Route.Team);

    const SELECTOR = '#lista-druzyna .box.light-blue.round.poke-team-box';
    const elements = await page.$$(SELECTOR);
    if (elements.length === 0) {
        throw new Error('Pokemon elements empty');
    }

    return Promise
        .all(
            elements.map((elem): Promise<Pokemon> => Promise
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
        .then((p) => new Team(p));
}

export class Environment {
    static async getApCount (page: Page): Promise<Pick<EnvironmentState, 'actionPointsCount' | 'maxActionPoinsCount'>> {
        const [actionPointsCount, maxActionPoinsCount] = await Promise.all([
            page.getText('#action_points_count').then(toNumber),
            page.getText('#max_action_points_count').then(toNumber),
        ]);
        return { actionPointsCount, maxActionPoinsCount };
    }

    static async getPokeCount (page: Page): Promise<Pick<EnvironmentState, 'pokemonCount' | 'maxPokemonCount'>> {
        const [pokemonCount, pokemonCountInfo] = await Promise.all([
            page.getText('.rezerwa-count').then(toNumber),
            page.getText('#bottom_bar .rezerwa_info'),
        ]);

        const maxPokemonCount = toNumber(
            pokemonCountInfo
                .split('/', 2)[1]
                .trim()
        );

        return { pokemonCount, maxPokemonCount };
    }

    static async getMoneyAmount (page: Page): Promise<Pick<EnvironmentState, 'moneyAmount'>> {
        return {
            moneyAmount: await page.getText('#money').then(toMoneyAmount),
        };
    }

    static async get (page: Page): Promise<Environment> {
        const [money, pokemon, ap] = await Promise.all([
            Environment.getMoneyAmount(page),
            Environment.getPokeCount(page),
            Environment.getApCount(page),
            page.click('panel_tab team_icon'),
        ]);


        await page.ensurePath(Route.Team);
        const team = await getTeamInfo(page);

        return new Environment(page, {
            ...ap,
            ...money,
            ...pokemon,
            team,
            moneyToWithdraw: null,
        });
    }

    page: Page;
    data: EnvironmentState;

    constructor (page: Page, data: EnvironmentState) {
        this.page = page;
        this.data = data;
    }

    isPokeboxFull (): boolean {
        return this.data.maxPokemonCount === this.data.pokemonCount;
    }

    hasMoneyInPocket (): boolean {
        return this.data.moneyAmount > 1000;
    }

    isLeaderHealthy (): boolean {
        const hp = this.data.team.leader.hp;
        const healMethod = this.page.config('leader.healMethod')[0];
        switch (healMethod) {
            case 'juice': return hp > 0;
            default: return hp > this.page.config('leader.minHealth');
        }
    }

    setMoneyToWithdraw (amount: Option<number>): void {
        this.data.moneyToWithdraw = amount;
    }

    getMoneyToWithdraw (): Option<number> {
        return this.data.moneyToWithdraw;
    }
}

