import { Task } from "../types";
import { TASK, HUNT_RESULT } from "../constants.js";
import { getHuntResult, tryTakeItems } from './hunt/hunt_result.js';
import {selectLeaderToFight, isLeaderVictorious} from "./hunt/fight.js";
import {throwPokeballs} from "./hunt/throw_pokeballs.js";

const locactionSelector = (title: string) => `.location a[title="${title}"]`;

export const Hunt: Task = {
    name: TASK.HUNT,
    async perform (app, _params) {
        await app.page.clickNavigate(locactionSelector(app.state.location.text));

        const huntResult = await getHuntResult(app);

        app.logger.info({
            huntResult,
            msg: 'Hunt result',
        });

        switch (huntResult) {
            case HUNT_RESULT.POKEMON_ENCOUNTER:
                await selectLeaderToFight(app);
                
                if (!(await isLeaderVictorious(app))) {
                    break;
                }

                await throwPokeballs(app);
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
                // TODO: If incubator is empty, then place the egg in it
                break;

            case HUNT_RESULT.NOTHING:
                break;
        }
    },
};
