import { App } from "../types";
import { TASK, HUNT_RESULT } from "../constants.js";
import { getHuntResult } from './hunt/hunt_result.js';
import {fightWithLeader, isLeaderVictorious, tryTakeItems} from "./hunt/fight.js";
import {throwPokeballs} from "./hunt/throw_pokeballs.js";

const locactionSelector = (title: string) => `.location a[title="${title}"]`;

export const Hunt: App.TaskImpls<TASK.HUNT> = {
    name: TASK.HUNT,
    async perform (app) {
        await app.extern.clickAndNavigate(locactionSelector(app.state.location.original));

        const huntResult = await getHuntResult(app);

        app.logger.info({
            huntResult,
            msg: 'Hunt result',
        });

        switch (huntResult) {
            case HUNT_RESULT.POKEMON_ENCOUNTER:
                const pokemon = await app.extern.getEncounterPokemonInfo();
                await fightWithLeader(app);
                
                if (!(await isLeaderVictorious(app))) {
                    break;
                }

                await throwPokeballs(app, pokemon);
                await tryTakeItems(app);
                break;

            case HUNT_RESULT.TEAM_FIGHT:
                break;

            case HUNT_RESULT.ITEM:
                break;

            case HUNT_RESULT.TRADER:
                break;

            case HUNT_RESULT.MOVE_TUTOR:
                break;

            case HUNT_RESULT.POKEMON_EGG:
                await app.extern
                    .clickAndNavigate('input[type=submit][name="insert_egg_to_inkubator"]')
                    .catch((error) => {
                        app.logger.error({ error, msg: 'Error while inserting an egg to incubator' });
                    });
                break;

            case HUNT_RESULT.NOTHING:
                break;
        }
    },
};
