import type { App } from "../../types";
import {EVENT} from "../../constants";

export async function fightWithLeader (app: App.Core): Promise<void> {
    const formName = `poke_${app.state.leader.id}`;

    app.logger.debug({
        formName,
        msg: 'fightWithLeader',
    });

    return await app.extern.submitAndNavigate(formName);
}

export async function isLeaderVictorious (app: App.Core): Promise<boolean> {
    const selector = '.col .infoBar.error';
    
    app.logger.debug({
        selector,
        msg: 'isLeaderVictorious',
    });

    return await app.extern.evaluateResult(() => window
        .one('.col .infoBar.error', null)
        .mapOrElse(() => false as boolean, () => true));
}

export async function tryTakeItems (app: App.Core): Promise<void> {
    const caught = await app.extern.evaluateResult(() => window
        .one('.found_pokemon_bg', null)
        .mapOrElse(() => true, () => false));

    if (!caught) {
        app.stats.add(EVENT.THROW_FAILED);
        return;
    }

    app.stats.add(EVENT.THROW_SUCCESSFUL);

    const selector = 'input[name="zdejmij_przedmioty"]';
    const exists = await app.extern.evaluateResult(() => window
        .one('input[name="zdejmij_przedmioty"]', null)
        .mapOrElse(() => true, () => false))

    if (exists) {
        await app.extern.clickAndNavigate(selector);
    }
}
