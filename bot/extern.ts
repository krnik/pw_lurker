import { Extern } from "../core/types";
import {BotPage} from "./page";

// general.js#evolve
declare function evolve(pokemonId: number): Promise<Extern.Result>;
// general.js#changePanelTab
declare function changePanelTab(tabName: Extern.TabName): Promise<Extern.Result>;

export class BotExtern implements Extern.Core {
    public page: BotPage;
    
    public constructor (page: BotPage) {
        this.page = page;
    }

    public async evolve (pokemonId: number): Promise<Extern.Result> {
        return this.page.evaluate((id) => evolve(id), pokemonId);
    }

    public async changePanelTab(tabName: Extern.TabName): Promise<Extern.Result> {
        return this.page.evaluate((tab) => changePanelTab(tab), tabName);
    }
}
