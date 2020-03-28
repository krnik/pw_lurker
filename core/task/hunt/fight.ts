import type { App } from "../../types";

export async function selectLeaderToFight (app: App.Core): Promise<void> {
    const formName = `poke_${app.state.leader.id}`;

    app.logger.debug({
        formName,
        msg: 'selectLeaderToFight',
    });

    return await app.page.submitNavigate(formName);
}

export async function isLeaderVictorious (app: App.Core): Promise<boolean> {
    const selector = '.col .infoBar.error';
    
    app.logger.debug({
        selector,
        msg: 'isLeaderVictorious',
    });

    return await app.page.getElems(selector).then((elems) => elems.length === 0);
}
