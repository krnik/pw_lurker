import type { State, Config } from "../core/types";
import {ROUTE} from "../core/constants.js";
import {BotPage} from "./page.js";
import {toNumber, toMoneyAmount, some, is} from "../core/utils.js";

type StatePiece<K extends keyof State.Core> = Promise<Pick<State.Core, K>>;

const leaderSelector = (id: number, active = false) => `.team_member.poke_view_btn.main_menu_poke${active ? '.active' : ''}[poke_id="${id.toString()}"]`;

export class BotState implements State.Core {
    public page: BotPage;
    public actionPointsCount: number;
    public maxActionPoinsCount: number;
    public maxPokemonCount: number;
    public pokemonCount: number;
    public team: State.Pokemon[];
    public leader: State.Pokemon;
    public location: State.Location;
    public locations: State.Location[];
    public moneyAmount: number;

    constructor (page: BotPage, data: Omit<State.Core, 'refresh'>) {
        this.page = page;
        this.maxActionPoinsCount = data.maxActionPoinsCount;
        this.actionPointsCount = data.actionPointsCount;
        this.maxPokemonCount = data.maxPokemonCount;
        this.pokemonCount = data.pokemonCount;
        this.team = data.team;
        this.leader = data.leader;
        this.moneyAmount = data.moneyAmount;
        this.location = data.location;
        this.locations = data.locations;
    }

    private async updateLeaderHealth (): Promise<void> {
        const LEADER_HP = '#info-box-content .progress_bar .progress.red ~ .text';

        const elems = await this.page.getElems(leaderSelector(this.leader.id, true));
        if (elems.length === 0) {
            const message = 'Cannot update leader health because it is not actively selected pokemon in the side tab.';
            throw new Error(message);
        }

        const text = await this.page.getText(LEADER_HP)
        const hpBar = text.split(/:|\//g).slice(1).map((str) => toNumber(str.trim().replace('.', '')));
        
        this.leader.hp = hpBar[1];
        this.leader.maxHP = hpBar[2];
    }

    public isPokeboxFull (): boolean {
        return this.pokemonCount >= this.maxPokemonCount;
    }

    public hasMoneyInPocket (): boolean {
        return this.moneyAmount > 1000;
    }

    public isLeaderHealthy (minimum: number): boolean {
        return this.leader.hp >= minimum;
    }

    public isRefillNeeded (minimum: number): boolean {
        return this.actionPointsCount < minimum;
    }

    public async refresh (): Promise<void> {
        const [money, pokeCount, ap] = await Promise.all([
            BotState.getMoneyInfo(this.page),
            BotState.getPokemonCountInfo(this.page),
            BotState.getAPInfo(this.page),
            this.updateLeaderHealth(),
        ]);

        this.moneyAmount = money.moneyAmount;
        this.pokemonCount = pokeCount.pokemonCount;
        this.maxPokemonCount = pokeCount.maxPokemonCount;
        this.actionPointsCount = ap.actionPointsCount;
        this.maxActionPoinsCount = ap.maxActionPoinsCount;
    }

    public static async create (page: BotPage, config: Config.Core): Promise<BotState> {
        await page.ensurePath(ROUTE.TEAM);

        const locations = await BotState.getAvailableLocations(page);
        const locationName  = config['hunt.location'];
        const location = locations.find((loc) => loc.name === locationName);

        if (is.none(location)) {
            const message = `Cannot find the location "${config['hunt.location']}" set in the "bot.location" config`;
            throw new Error(message);
        }

        const [money, team, pokeCount, ap] = await Promise.all([
            BotState.getMoneyInfo(page),
            BotState.getTeamInfo(page),
            BotState.getPokemonCountInfo(page),
            BotState.getAPInfo(page),
        ]);

        await page.click(leaderSelector(team.leader.id));

        return new BotState(page, { 
            ...money,
            ...team,
            ...pokeCount,
            ...ap,
            location,
            locations,
        });
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

    private static async getTeamInfo (page: BotPage): StatePiece<'leader' | 'team'> {
        const SELECTOR = '#lista-druzyna .box.light-blue.round.poke-team-box';
        const elements = await page.getElems(SELECTOR);

        if (elements.length === 0) {
            throw new Error('Pokemon elements empty');
        }

        return await Promise
            .all(
                elements.map((elem): Promise<State.Pokemon> => Promise
                    .all([
                        elem.evaluate((e) => e.classList.contains('leader')),
                        elem.evaluate((e) => e.getAttribute('poke_id')).then(toNumber),
                        elem.$('.team-lvl')
                            .then((e) => some(e).evaluate((self) => self.textContent))
                            .then(toNumber),
                        elem.$('.team-hp')
                            .then((e) => some(e).evaluate((self) => self.textContent))
                            .then((text) => some(text).split('/', 2).map(toNumber)),
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
                team: pokemons,
                leader: some(pokemons.find((pokemon) => pokemon.leader)),
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
