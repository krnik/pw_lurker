import type {Page} from "./page";
import {getNextActions, getAction} from "./info/nextActions.js";
import { Environment } from "./info/environment.js";
import type {Option} from "./types";

export class Bot {
    page: Page;
    environment: Option<Environment>;

    constructor (page: Page) {
        this.page = page;
        this.environment = null;
    }

    async act (): Promise<void> {
        const { environment, actions } = await getNextActions(this.page, this.environment);
        this.page.logger.info({ actions, msg: 'Next actions' });
        this.environment = environment;

        if (actions.length === 0) {
            throw new Error('Could not infer proper actions');
        }

        while (actions.length > 0) {
            const action = getAction(actions[0]);
            await action.perform(this.page, this.environment);
            actions.shift();
        }

        this.page.logger.debug({ msg: 'All actions performed' });
        setTimeout(() => this.act(), 500);
    }
}

