/// POKEWARS
declare function showInfo (t: number, msg: string): void;

function setCookie (cookieName: string, cookieValue: string, nDays?: number) {
    var today = new Date();
    var expire = new Date();
    if (nDays==null || nDays==0) nDays=1;
    expire.setTime(today.getTime() + 3600000*24*nDays);
    document.cookie = `${cookieName}=${escape(cookieValue)};expires=${expire.toUTCString()};path=/`;
}

/// CUSTOM
function nonNull<T> (value: T): Exclude<T, null> {
    if (value === null) {
        const msg = 'Value cannot be null!';
        throw new Error(msg);
    }
    return value as Exclude<T, null>;
}

type UIState = {
    config: Config,
    emitter: Emitter,
};
type OptionValue = number | string | boolean;
type OptionChange = {
    prop: string;
    value: OptionValue;
};
const enum ConfigEvent {
    Load = 'load',
    Save = 'save',
    Change = 'change',
};

type Keys<T extends Record<string, string>> = { [K in keyof T]: T[K] };
type AllValues<T extends Record<string, string>> = {
    [K in keyof T]: { key: K, value: T[K] }
}[keyof T];
type Values<T extends Record<string, string>> = {
    [K in AllValues<T>['value']]: Extract<AllValues<T>, { value: K }>['key']
};
type Enum<T extends Record<string, string>> = Keys<T> & Values<T>;

function en<I extends Record<string, string>> (map: I): Enum<I>  {
    const result = {} as Enum<I>;
    for (const key in map) {
        result[key] = map[key];
        // @ts-ignore
        result[map[key]] = key;
    }
    return result;
}

class Emitter {
    private static invokeWith (args: unknown[]): (fn: Function) => void {
        return (fn) => fn(...args);
    }

    private events: Map<string, Function[]> = new Map();
    private onceEvents: Map<string, Function[]> = new Map();
    public enabled: boolean = true;

    enable (value: boolean): this {
        this.enabled = value;
        return this;
    }

    on(event: string, fn: Function): this {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        const events = this.events.get(event);
        if (events === undefined) {
            throw new Error('Unreachable!');
        }
        
        events.push(fn);
        return this;
    }

    once(event: string, fn: Function): this {
        if (!this.onceEvents.has(event)) {
            this.onceEvents.set(event, []);
        }

        const events = this.events.get(event);
        if (events === undefined) {
            throw new Error('Unreachable!');
        }

        events.push(fn);
        return this;
    }

    trigger (event: string, ...args: unknown[]): this {
        if (!this.enabled) return this;

        const onces = this.onceEvents.get(event);
        if (onces !== undefined) {
            onces.forEach(Emitter.invokeWith(args));
            this.onceEvents.delete(event);
        }

        const events = this.events.get(event);
        if (events !== undefined) {
            events.forEach(Emitter.invokeWith(args));
        }

        return this;
    }
}

class Elem extends Emitter {
    static get (selector: string, target: HTMLElement | Document = document): Elem {
        const elements = target.querySelectorAll<HTMLElement>(selector);
        if (elements.length !== 1) {
            const msg = `Selector ${selector} must match exactly 1 element (matched ${elements.length})`;
            throw new Error(msg);
        }
        return new Elem(elements[0]);
    }

    static getAll (selector: string, target: HTMLElement | Document = document): Elem[] {
        const elements = target.querySelectorAll<HTMLElement>(selector);
        if (elements.length === 0) {
            const msg = `Selector ${selector} must match at least 1 element, matched 0`;
            throw new Error(msg);
        }
        const elems = [];
        for (let i = 0; i < elements.length; i++) {
            elems.push(new Elem(elements[i]));
        }
        return elems;
    }

    private elem: HTMLElement;

    public constructor (source: string | HTMLElement) {
        super();
        
        if (typeof source === 'string') {
            this.elem = document.createElement(source);
        } else {
            this.elem = source;
        }
    }

    public style<S extends Partial<CSSStyleDeclaration>>(styles: S): this {
        for (const key in styles) {
            const value = styles[key];
            if (!value) continue;

            this.elem.style[key] = value;
        }
        return this;
    }

    public prop<K extends keyof HTMLElement>(key: K, value: HTMLElement[K]): this {
        this.elem[key] = value;
        return this;
    }

    public child (element: Elem): this {
        this.elem.appendChild(element.elem);
        return this;
    }

    public text (text: string): this {
        this.elem.textContent = text;
        return this;
    }

    public click (): this {
        setCookie('mp', Math.round(Math.random() * 40 + 10).toString());
        this.elem.click();
        return this;
    }

    public select (selector: string): Elem {
        return Elem.get(selector, this.elem);
    }
}


class Config extends Emitter {
    data: Record<string, OptionValue> = {};

    public constructor () {
        super();

        this.load();

        this.on(ConfigEvent.Save, () => this.save());
        this.on(ConfigEvent.Load, () => this.load());
    }

    public set (prop: string, value: number | boolean | string): this {
        this.data[prop] = value;
        this.save();
        this.trigger(ConfigEvent.Change, { prop, value });
        return this;
    }

    public get (prop: string) {
        return this.data[prop];
    }

    private load (): this {
        const data = localStorage.getItem('conf');
        if (data) {
            const obj = JSON.parse(data) as Record<string, OptionValue>;
            for (const key in obj) {
                this.set(key, obj[key]);
            }
        }
        return this;
    }

    private save (): this {
        localStorage.setItem('conf', JSON.stringify(this.data));
        return this;
    }
}

const KEY = en({
    '1': '49',
    '2': '50',
    '3': '51',
    '4': '52',
    '5': '53',
    '6': '54',
    '7': '55',
    '8': '56',
    '9': '57',
    '0': '48',
    'q': '81',
    'w': '87',
    'e': '69',
} as const);

function color (enabled: unknown): string {
    return `rgba(0, 0, 0, ${enabled ? 1 : 0.2})`;
}

function renderLocations ({ config, emitter }: UIState): void {
    const locations = Elem.getAll('.location');
    
    config.on(ConfigEvent.Change, ({ prop, value }: OptionChange) => {
        if (prop === 'enabled') {
            locations.forEach((loc) => loc.style({
                color: color(value),
            }));
        }
    });
    
    locations.forEach((loc, i) => {
        const anchor = nonNull(loc.select('a'));
        const num = (i + 1).toString() as keyof typeof KEY;
        const numTag = new Elem('div')
        .style({
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '2em',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
        })
        .prop('onclick', () => anchor.click())
        .text(num);

        loc.child(numTag).style({ position: 'relative' });
        emitter.on(KEY[num], () => anchor.click());
    });
}

function renderUtilKeys ({ config, emitter }: UIState): void {
    function sendForm (url: string, data: Record<string, string>) {
        const form = new FormData();

        for (const [k, v] of Object.entries(data)) {
            form.append(k, v);
        }

        return fetch(url, {
            method: 'POST',
            body: form,
        });
    }

    const buttons = [
        {
            icon: 'https://gra.pokewars.pl/img/icons/yen_icon.png',
            action: async (btn: Elem) => {
                btn.style({ color: color(false) });

                await sendForm('/hodowla', { sellAll: '' }).finally(() => btn.style({ color: color(true) }));
            },
            key: KEY['e'],
        }
    ];
    
    const bar = Elem.get('#bottom_bar').style({ zIndex: '10' });
    const getTop = (enabled: unknown): string => enabled ? '-40px' : '0';
    const utilBar = new Elem('div')
        .style({
            position: 'absolute',
            display: 'flex',
            flexDirection: 'row',
            left: '0',
            top: getTop(config.get('enabled')),
            height: '40px',
            transition: 'all 0.2s',
        });

    buttons.forEach(({ icon, action, key }) => {
        const btn = new Elem('div')
            .text(KEY[key])
            .style({
                color: 'black',
                fontSize: '2em',
                width: '40px',
                height: '40px',
                backgroundImage: `url(${icon})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'norepeat',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                zIndex: '-1',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            });

        utilBar.child(btn);
        emitter.on(key, action);
    });

    config.on(ConfigEvent.Change, ({ prop, value }: OptionChange) => {
        if (prop === 'enabled') {
            utilBar.style({ top: getTop(value) });
        }
    });
    bar.child(utilBar);
}

function setupDocumentKeyListeners ({ config, emitter }: UIState): void {
    document.onkeydown = (event: KeyboardEvent) => {
        if (event.altKey && event.which === 65) {
            const enabled = !config.get('enabled');
            config.set('enabled', enabled);
            emitter.enable(enabled);
        }
        emitter.trigger(event.which.toString());
    };

}


function UI () {
    const state: UIState = {
        emitter: new Emitter(),
        config: new Config(),
    };
    
    setupDocumentKeyListeners(state);
    renderLocations(state);
    renderUtilKeys(state);

    state.config.trigger(ConfigEvent.Load);
}

function execute (fn: Function, ...args: unknown[]) {
    function run () {
        try {
            fn.apply(undefined, args);
        } catch (error) {
            showInfo(3, error.message);
            console.error(error);
        }
    }

    if (document.readyState === 'complete') {
        return run();
    }

    document.onreadystatechange = () => {
        return document.readyState === 'complete' ? run() : undefined;
    };
}

execute(UI);
