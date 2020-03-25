import { Page, ElementHandle } from "puppeteer";
import { some } from "../utils.js";

type Location = {
    name: string,
    ref: ElementHandle<Element>,
};

export class Locations {
    public static async init (page: Page): Promise<Locations> {
        console.log(Date.now(), await page.$$('.location'));
        const locations = await page.$$('.location')
            .then((locs) => Promise.all(
                locs.map(async (loc) => {
                    const a = some(await loc.$('a'));
                    const title = await a.evaluate((e) => e.getAttribute('title'));

                    const name = some(title)
                        .toLowerCase()
                        .replace(/poluj\s+w/g, '')
                        .trim()
                        .replace(/\s/g, '-');

                    return { name, ref: a };
                })
            ));

        return new Locations(locations);
    }

    locations: Map<string, ElementHandle<Element>>;

    constructor (locations: Location[]) {
        this.locations = new Map();

        for (const { name, ref } of locations) {
            this.locations.set(name, ref);
        }
    }
}
