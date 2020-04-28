import { PWResult, PWError, NullOr } from './error';
import { Elem } from './elem';

declare global {
    export interface Window {
        one: typeof one;
        many: typeof many;
        num: typeof num;
        toMoneyAmount: typeof toMoneyAmount;
        toName: typeof toName;
        getLeaderHP: typeof getLeaderHP;
        getMoneyInfo: typeof getMoneyInfo;
        getAPInfo: typeof getAPInfo;
        getPokemonCountInfo: typeof getPokemonCountInfo;
        getTeamInfo: typeof getTeamInfo;
        getAvailableLocations: typeof getAvailableLocations;
        getText: typeof getText;
        evolve: typeof evolve;
        evolveAdvanced: typeof evolveAdvanced;
        teamGetPokemonList: typeof teamGetPokemonList;
        getReservePokemons: typeof getReservePokemons;
        getEncounterPokemonInfo: typeof getEncounterPokemonInfo;
        moveToPokebox: typeof moveToPokebox;
        setPanelTabToTeam: typeof setPanelTabToTeam;
        getPokeballInfo: typeof getPokeballInfo;
        submit: typeof submit;
    }
}

namespace Info {
    export type Reserve = { current: number, max: number };
    export type AP = { current: number, max: number };
    export type Loc = { original: string, name: string };
    export type HP = { current: number, max: number };
    export type Pokemon = { name: string, leader: boolean, level: number, id: number, hp: HP };
    export type ReservePokemon = { name: string, level: number, id: number, canEvolve: boolean };
    export type EncounterPokemon = { name: string, types: string[], level: number, items: string[] };
    export type Pokeball = { name: string, chance: number, quantity: number };
}

function one<E extends HTMLElement> (selector: string, source: NullOr<string>): PWResult<Elem<E>> {
    const noElem = () => PWError.noElem({ selector });
    if (source === null) {
        return PWResult
            .errIfNull(document.querySelector<E>(selector), noElem)
            .map(Elem.fromElement);
    }

    const root = document.querySelector<HTMLElement>(source);
    const option = root !== null
        ? root.querySelector<E>(selector)
        : document.querySelector<E>(selector);

    return PWResult.errIfNull(option, noElem).map(Elem.fromElement);
}

function many<E extends HTMLElement> (selector: string): PWResult<Elem<E>[]> {
    return PWResult.ok(
        Array.from(document.querySelectorAll<E>(selector))
            .map(Elem.fromElement)
    );
}

function num(value: unknown): PWResult<number> {
    const num = Number(value);
    return typeof num === 'number' && num === num 
        ? PWResult.ok(num)
        : PWResult.err(PWError.numberConversion(value));
}

function getText (selector: string): PWResult<string> {
    return one(selector, null).map((elem) => elem.text());
}

function toName (value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, '-');
}

export function getLeaderHP (): PWResult<Info.HP> {
    const LEADER_HP = '#info-box-content .progress_bar .progress.red ~ .text';

    const hpElem = one(LEADER_HP, null).unwrap();
    return PWResult
        .flat(
            hpElem
                .text()
                .split(/:|\//g)
                .slice(1)
                .map((str) => num(str.trim().replace('.', '')))
        )
        .map(([current, max]) => ({ current, max }));
}

export function toMoneyAmount (balance: string): PWResult<number> {
    const amount = /^\d+/.exec(balance.replace('.', '').trim());

    return PWResult
        .errIfNull(
            amount,
            () => PWError.new('TO_MONEY_AMOUNT', { balance }),
        )
        .map(([match]) => num(match));
}

export function getMoneyInfo (): PWResult<number> {
    const MONEY_SELECTOR = '#info-box-content div table tbody tr:first-of-type td:last-child';

    const moneyElem = one(MONEY_SELECTOR, null).unwrap();
    return toMoneyAmount(moneyElem.text());
}

export function getAPInfo (): PWResult<Info.AP> {
    const AP_SELECTOR = '#action_points_count';
    const MAX_AP_SELECTOR = '#max_action_points_count';

    const current = one(AP_SELECTOR, null).map((el) => num(el.text())).unwrap();
    return one(MAX_AP_SELECTOR, null)
        .map((el) => num(el.text()))
        .map((max) => ({ current, max }));
}

export function getPokemonCountInfo(): PWResult<Info.Reserve> {
    const COUNT_SELECTOR = '.rezerwa-count';
    const MAX_COUNT_SELECTOR = '#bottom_bar .rezerwa_info';

    const current = one(COUNT_SELECTOR, null).map((el) => num(el.text())).unwrap();
    return one(MAX_COUNT_SELECTOR, null)
        .map((el) => num(el.text().split('/')[1].trim()))
        .map((max) => ({ current, max }));
}

export function getTeamInfo(): PWResult<Info.Pokemon[]> {
    const SELECTOR = '#lista-druzyna .box.light-blue.round.poke-team-box';
    const boxes = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR)).map(Elem.fromElement);

    return PWResult.flat(boxes.map((box) => {
        const name = box.one('.team-title-mask')
            .map((elem) => PWResult.errIfNull(
                elem.childNodes()[0].textContent,
                () => PWError.new('TEAM_INFO_ERROR', { context: 'name elem child node text content empty' }),
            ))
            .map(toName)
            .unwrap();
        const level = box.one('.team-lvl')
            .map((elem) => num(elem.text()))
            .unwrap();
        const leader = box.hasClass('leader');
        const id = box.attr('poke_id').map(num).unwrap();

        return PWResult
            .flat(
                box.one('.team-hp')
                    .map((elem) => elem.text())
                    .map((text) => text.split('/').map(num))
                    .unwrap()
            )
            .map((health) => ({
                id,
                leader,
                name,
                level,
                hp: { current: health[0], max: health[1] },
            }));
    }));
}

export function getAvailableLocations (): PWResult<Info.Loc[]> {
    const locs = Array.from(document.querySelectorAll<HTMLElement>('.location a')).map(Elem.fromElement);

    return PWResult
        .flat(
            locs.map((loc) => loc
                .attr('title')
                .map((title) => {
                    const norm = title.toLowerCase().replace(/poluj\s+w/g, '').trim().replace(/\s/g, '-');
                    return { 
                        original: title,
                        name: norm,
                    };
                }))
        )
}

function intoResponse<A extends any[], T> (fn: (...args: A) => PWResult<T>): (...args: A) => PWResult<T> {
    return (...args: A) => {
        try {
            return fn(...args);
        } catch (error) {
            return error instanceof PWError 
                ? PWResult.err(error)
                : PWResult.err(PWError.new('RUNTIME_ERROR', { functionName: fn.name }));
        }
    };
}

function intoAsyncResponse<A extends any[], T> (fn: (...args: A) => Promise<PWResult<T>>): (...args: A) => Promise<PWResult<T>> {
    return async (...args: A) => {
        try {
            return fn(...args);
        } catch (error) {
            return error instanceof PWError
                ? PWResult.err(error)
                : PWResult.err(PWError.new('RUNTIME_ERROR', { functionName: fn.name }));
        }
    };
}

export function getReservePokemons (): PWResult<Info.ReservePokemon[]> {
    const boxes = Array.from(document.querySelectorAll<HTMLElement>('.box.rezerwa-box')).map(Elem.fromElement);

    return PWResult.ok(
        boxes.map((box) => {
            const id = box.attr('poke_id').map(num).unwrap();
            const level = box.one('.r-lvl').map((elem) => num(elem.text())).unwrap();
            const name = box.one('.r-title').map((elem) => toName(elem.text().trim().replace(/\d+$/, '').trim())).unwrap();
            const canEvolve = box.one('a[onclick^=evolve]').mapOrElse(() => true, () => false).unwrap();

            return { id, level, name, canEvolve };
        })
    );
}

export function getEncounterPokemonInfo (): PWResult<Info.EncounterPokemon> {
    const TYPES = [
        'normal',
        'fire',
        'fighting',
        'water',
        'flying',
        'grass',
        'poison',
        'electric',
        'ground',
        'psychic',
        'rock',
        'ice',
        'bug',
        'dragon',
        'ghost',
        'dark',
        'steel',
        'fairy',
    ];

    const box = one('.loc-poke', null).unwrap();
    const name = box.one('.poke-name').map((elem) => toName(elem.text())).unwrap();
    const types = many('.loc-poke .type')
        .map((elems) => elems.map((elem) => elem.classList().filter((t) => TYPES.includes(t))))
        .unwrap()
        .flat();
    const level = box.one('.two_cols tbody tr:first-child td:last-child').map((elem) => num(elem.text())).unwrap();
    const items = PWResult
        .flat(box
            .many<HTMLElement>('img[src*=items]')
            .map((elem) => elem.attr('src'))
        )
        .map((sources) => sources
            .map((source) => {
                const chunks = source.split('/');
                const name = chunks[chunks.length - 1];
                return name && toName(name.replace('.png', ''));
            })
            .filter((source) => source)
        )
        .unwrap();

    return PWResult.ok({ name, types, level, items });
}

export function evolve (id: number): Promise<PWResult<boolean>> {
    const data = { id, method: 'team_poke', func: 'evolve' };

    return new Promise((resolve) => $.ajax({
        data,
        url: '/ajax',
        type: 'post',
        success: () => resolve(PWResult.ok(true)),
        error: () => resolve(PWResult.err(PWError.new('AJAX_ERROR', { data }))),
    }));
}

export function evolveAdvanced (id: number, formId: number): Promise<PWResult<boolean>> {
    const data = { id, next_id: formId, method: 'team_poke', func: 'evolve_advanced' };

    return new Promise((resolve) => $.ajax({
        data,
        url: '/ajax',
        type: 'post',
        success: () => resolve(PWResult.ok(true)),
        error: () => resolve(PWResult.err(PWError.new('AJAX_ERROR', { data }))),
    }));
}

export function teamGetPokemonList (): Promise<PWResult<boolean>> {
    return new Promise((resolve) => $.ajax({
        url: '/ajax',
        data: {
            method: 'team_poke',
            func: 'get_poke_list',
            list_name: 'rezerwa',
            sort: null,
            dir: null,
        },
        type: 'post',
        success: (output) => {
            $('#poke_content').html(output);
            $('span.rezerwa-count')
                .text($('div#lista-rezerwa .p-counter').length);

            return resolve(PWResult.ok(true));
        },
        error: () => resolve(PWResult.err(PWError.new('AJAX_ERROR', { functionName: teamGetPokemonList.name }))),
    }));
}

export function moveToPokebox (id: number): Promise<PWResult<boolean>> {
    const data = {
        id,
        to: 'pokebox',
        from: 'rezerwa',
    };

    return new Promise((resolve) => $.ajax({
        data,
        url: '/ajax',
        type: 'post',
        success: () => resolve(PWResult.ok(true)),
        error: () => resolve(PWResult.err(PWError.new('AJAX_ERROR', { data }))),
    }));
}

function setPanelTabToTeam (): Promise<PWResult<boolean>> {
    const data = {
        method: 'load_tab',
        tab_name: 'team',
        update_content: 1,
    };

    return new Promise((resolve) => $.ajax({
        data,
        url: '/ajax_panel',
        type: 'post',
        success (output) {
            if (output.trim() != "") $("#info_col").html(output);
            if (output.trim() != "") {
              $(".panel_tab_box .panel_tab").removeClass("active");
              $(".panel_tab_box .panel_tab." + 'team' + "_icon").addClass("active");
            }
            return resolve(PWResult.ok(true));
        },
        error: () => resolve(PWResult.err(PWError.new('AJAX_ERROR', { data }))),
    }));
}

export function getPokeballInfo (): PWResult<Info.Pokeball[]> {
    const forms = many('form')
        .map((elems) => elems
            .filter((elem) => elem
                .many('input[name=pokeball]').length > 0))
        .unwrap();

    return PWResult.ok(forms.map((form) => {
        const name = form
            .one('input[type=pokeball]')
            .map((input) => input.attr('value'))
            .map(toName)
            .unwrap();
        const description = form
            .one('.lvl')
            .map((elem) => elem.text().trim().replace(/\s+/g, '\n').replace('%', '').split('\n'))
            .unwrap();

        const chance = num(description[4]).unwrap();
        const quantity = num(description[2].replace('.', '')).unwrap();
        return { name, chance, quantity };
    }));
}

export function submit (formName: string): PWResult<boolean> {
    const byName = `form[name="${formName}"]`;
    const byId = `form[id="${formName}"]`;

    return one<HTMLFormElement>(byName, null)
        .mapOrElse(
            (elem) => elem,
            () => one<HTMLFormElement>(byId, null),
        )
        .map((form) => {
            form.submit();
            return true;
        });
}

Object.assign(window, {
    toName,
    one: intoResponse(one),
    many: intoResponse(many),
    num: intoResponse(num),
    toMoneyAmount: intoResponse(toMoneyAmount),
    getLeaderHP: intoResponse(getLeaderHP),
    getMoneyInfo: intoResponse(getMoneyInfo),
    getAPInfo: intoResponse(getAPInfo),
    getPokemonCountInfo: intoResponse(getPokemonCountInfo),
    getTeamInfo: intoResponse(getTeamInfo),
    getAvailableLocations: intoResponse(getAvailableLocations),
    getReservePokemons: intoResponse(getReservePokemons),
    getEncounterPokemonInfo: intoResponse(getEncounterPokemonInfo),
    getText: intoResponse(getText),
    evolve: intoAsyncResponse(evolve),
    evolveAdvanced: intoAsyncResponse(evolveAdvanced),
    teamGetPokemonList: intoAsyncResponse(teamGetPokemonList),
    moveToPokebox: intoAsyncResponse(moveToPokebox),
    setPanelTabToTeam: intoAsyncResponse(setPanelTabToTeam),
    getPokeballInfo: intoResponse(getPokeballInfo),
    submit: intoResponse(submit),
});

