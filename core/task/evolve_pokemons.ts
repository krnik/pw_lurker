import type {App, State, Config} from "../types";
import {TASK, ROUTE, EVENT} from "../constants.js";
import {evaluateCondition} from "../condition";

const ADV_EVO: Record<string, number> = {
    Kirlia: 282,
    Wurmple: 0,
    Snorunt: 0,
    Burmy: 0,
    Cosmoem: 0,
    Slowpoke: 80,
};

const IGNORED_EVO: string[] = [
    "murkrow",
    "sneasel",
    "gligar",
    "kadabra",
    "machoke",
    "graveler",
    "haunter",
    "boldore",
    "gurdurr",
    "swirlix",
    "phantump",
    "pumpkaboo",
    "shelmet",
    "karrablast",
    "onix",
    "scyther",
    "electabuzz",
    "feebas",
    "clamperl",
    "dusclops",
    "magmar",
    "rhydon",
    "porygon2",
    "porygon",
    "seadra",
    "magneton",
    "nosepass",
    "charjabug",
    "crabrawler",
    "misdreavus",
    "lampent",
    "doublade",
    "eevee",
    "pikachu",
    "eelektrik",
    "nidorina",
    "nidorino",
    "clefairy",
    "jigglypuff",
    "skitty",
    "munna",
    "growlithe",
    "pansear",
    "vulpix",
    "gloom",
    "weepinbell",
    "exeggcute",
    "nuzleaf",
    "pansage",
    "poliwhirl",
    "shellder",
    "staryu",
    "lombre",
    "panpour",
    "sunkern",
    "cottonee",
    "petilil",
    "helioptile",
    "togetic",
    "roselia",
    "minccino",
    "floette",
    "happiny",
    "pichu",
    "cleffa",
    "igglybuff",
    "golbat",
    "togepi",
    "azurill",
    "budew",
    "chingling",
    "munchlax",
    "buneary",
    "riolu",
    "chansey",
    "woobat",
    "swadloon",
    "spritzee",
    "heliolisk",
];

function shouldMoveToPokebox (pokemon: State.ReservePokemon, setting: Config.PokeboxMove[]): boolean {
    return setting.some((condition) => {
        switch (condition.type) {
            case 'shiny':
                return evaluateCondition({ startsWith: 'shiny' }, pokemon.name)
            case 'name':
                return evaluateCondition(condition, pokemon.name);
            case 'level':
                return evaluateCondition(condition, pokemon.level);
        }
    });
}

export const EvolvePokemons: App.TaskImpls<TASK.EVOLVE_POKEMONS> = {
    name: TASK.EVOLVE_POKEMONS,
    async perform (app) {
        await app.extern.ensurePathname(ROUTE.TEAM);

        let evolved = 0;
        
        for (let i = 0; i < 3; i++) {
            for (const pokemon of await app.extern.getReservePokemons()) {
                if (shouldMoveToPokebox(pokemon, app.config['hunt.pokemonPokeboxStore'])) {
                    await app.extern.moveToPokebox(pokemon.id);
                    continue;
                }

                const species = pokemon.name.replace('shiny-', '');

                if (IGNORED_EVO.includes(species)) {
                    app.logger.trace({
                        pokemon,
                        msg: 'Ignoring pokemon',
                    });
                    continue;
                }

                if (pokemon.canEvolve) {
                    app.logger.debug({
                        pokemon,
                        msg: 'Evolving pokemon',
                    });
                    
                    const nextForm = ADV_EVO[species];
                    await (nextForm === undefined
                        ? app.extern.evolve(pokemon.id)
                        : app.extern.evolveAdvanced(pokemon.id, nextForm));

                    evolved += 1;
                    continue;
                }

                await app.sleep(Math.floor(Math.random() * 300));
            }
        }

        app.stats.add(EVENT.EVOLVE_POKEMONS, evolved);
    },
};
