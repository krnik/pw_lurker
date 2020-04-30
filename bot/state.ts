import type { State, Config, Extern, Logger } from "../core/types";
import {ROUTE} from "../core/constants.js";
import {is} from "../core/utils.js";
import {BotExtern} from "./extern";

const leaderSelector = (id: number, active = false) => `.team_member.poke_view_btn.main_menu_poke${active ? '.active' : ''}[poke_id="${id.toString()}"]`;

export class BotState implements State.Core {
    private extern: Extern.Core;
    private logger: Logger.Core;
    public reserve: State.Reserve;
    public ap: State.AP;
    public location: State.Loc;
    public locations: State.Loc[];
    public leader: State.Pokemon;
    public team: State.Pokemon[];
    public money: number;

    constructor (extern: BotExtern, data: Omit<State.Core, 'refresh'>) {
        this.extern = extern;
        this.reserve = data.reserve;
        this.ap = data.ap;
        this.money = data.money;
        this.team = data.team;
        this.leader = data.leader;
        this.location = data.location;
        this.locations = data.locations;
        this.logger = extern.logger;
    }

    private async updateLeaderHealth (): Promise<void> {
        this.leader.hp = await this.extern.getLeaderHP();
    }

    public isPokeboxFull (): boolean {
        return this.reserve.current >= this.reserve.max;
    }

    public hasMoneyInPocket (): boolean {
        return this.money > 1000;
    }

    public isLeaderHealthy (minimum: number): boolean {
        return this.leader.hp.current >= minimum;
    }

    public isRefillNeeded (minimum: number): boolean {
        return this.ap.current < minimum;
    }

    public async refresh (): Promise<void> {
        this.logger.debug({ 
            msg: 'Refreshing state',
            function: 'BotState.refresh',
        });

        const [money, reserve, ap] = await Promise.all([
            this.extern.getMoneyInfo(),
            this.extern.getPokemonCountInfo(),
            this.extern.getAPInfo(),
            this.updateLeaderHealth(),
        ]);

        this.money = money;
        this.reserve = reserve;
        this.ap = ap;

        this.logger.debug({
            function: 'BotState.refresh',
            nextState: {
                money: this.money,
                reserve: this.reserve,
                ap: this.ap,
                leader: this.leader,
            }
        });
    }

    public static async create (extern: BotExtern, config: Config.Core): Promise<BotState> {
        await extern.ensurePathname(ROUTE.TEAM);

        const locations = await extern.getAvailableLocations();
        const locationName  = config['hunt.location'];
        const location = locations.find((loc) => loc.name === locationName);

        if (is.none(location)) {
            const message = `Cannot find the location "${config['hunt.location']}" set in the "bot.location" config`;
            throw new Error(message);
        }

        const [money, team, reserve, ap] = await Promise.all([
            extern.getMoneyInfo(),
            extern.getTeamInfo(),
            extern.getPokemonCountInfo(),
            extern.getAPInfo(),
        ]);

        const leader = team.find((pokemon) => pokemon.leader);
        if (is.none(leader)) {
            throw new Error('Couldnt find team leader!');
        }

        await extern.click(leaderSelector(leader.id));

        return new BotState(extern, { 
            money,
            reserve,
            ap,
            leader,
            team,
            location,
            locations,
        });
    }
}
