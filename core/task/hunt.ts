import { Task } from "../types";
import { TASK, HUNT_RESULT } from "../constants.js";
import { getHuntResult, tryTakeItems, getPokeInfo } from './hunt/hunt_result.js';
import {selectLeaderToFight, isLeaderVictorious} from "./hunt/fight.js";
import {throwPokeballs} from "./hunt/throw_pokeballs.js";

const locactionSelector = (title: string) => `.location a[title="${title}"]`;

export const Hunt: Task = {
    name: TASK.HUNT,
    async perform (app, _params) {
        await app.extern.clickAndNavigate(locactionSelector(app.state.location.original));

        const huntResult = await getHuntResult(app);

        app.logger.info({
            huntResult,
            msg: 'Hunt result',
        });

        switch (huntResult) {
            case HUNT_RESULT.POKEMON_ENCOUNTER:
                const pokeInfo = await getPokeInfo(app);
                await selectLeaderToFight(app);
                
                if (!(await isLeaderVictorious(app))) {
                    break;
                }

                await throwPokeballs(app, pokeInfo);
                await tryTakeItems(app);
                break;

            case HUNT_RESULT.TEAM_FIGHT:
                break;

            case HUNT_RESULT.ITEM:
                // TODO: Gather stats
                break;

            case HUNT_RESULT.TRADER:
                // TODO: Save trade offer ids
                // TODO: Handle trader
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
