import type { Page } from '../page';
import { Action, ActionName } from "../types.js";

export const login: Action = {
    name: ActionName.Login,
    async perform (page: Page): Promise<void> {
        await page.type('[name=login]', page.config('user.login'));
        await page.type('[name=pass]', page.config('user.password'));
        await page.clickAndWait('[name=zaloguj]');
    }
};
