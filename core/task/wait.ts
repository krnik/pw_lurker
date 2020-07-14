import { App } from "../types";
import { TASK, ROUTE, EVENT } from "../constants";
import r from 'readline';

let queue: Function[] = [];

const rl = r.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.on('line', (input: string) => {
    const n = Number(input);
    if (Number.isNaN(n)) {
        console.log('Invalid input, number expected');
        return;
    }
    const f = queue.shift();
    f && f(n);
});

function waitForInput (): Promise<number> {
    return new Promise((r) => {
        queue.push(r);
    });
}

function getWaitTime () {
    const minutes = new Date().getMinutes();
    const time = (minutes >= 30 ? 61 : 32) - minutes;
    return time * 60 * 1000;
}

export const Wait: App.TaskImpls<TASK.WAIT> = {
    name: TASK.WAIT,
    async perform (app) {
        const ms = getWaitTime();

        app.logger.info({
            ms,
            ends: new Date(Date.now() + ms).toUTCString(),
            msg: 'Waiting, you can press Number and then Enter to add more oaks.',
        });

        app.stats.add(EVENT.WAIT);

        await app.extern.ensurePathname(ROUTE.START);
        await Promise.race([
            app.sleep(ms),
            waitForInput().then((n: number) => { console.log({ n }); app.config.oaksLeft = n; }),
        ])
            .then(() => {
                queue = [];
            });
        await app.extern.reload();
    }
};
