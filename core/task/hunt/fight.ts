import type { App } from "../../types";

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
