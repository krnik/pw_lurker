import { Config, State } from "../../types";
import {evaluateCondition} from "../../condition";

const STARTERS = [
    'bulbasaur',
    'charmander',
    'squirtle',
    'chikorita',
    'cyndaquil',
    'totodile',
    'trecko',
    'torchic',
    'mudkip',
    'turtwig',
    'chimchar',
    'piplup',
    'snivy',
    'tepig',
    'oshawott',
    'chespin',
    'fennekin',
    'froakie',
    'rowlet',
    'litten',
    'popplio',
    'grookey',
    'scorbunny',
    'sobble',
];

export function getPokeballToThrow (
    availablePokeballs: State.Pokeball[],
    encounteredPokemon: State.EncounterPokemon,
    settings: Config.PokeballThrow,
): State.Pokeball | null {

    const pokeballs = availablePokeballs
        .filter(({ name }) => settings.pokeballs.includes(name as any))
        .filter((pokeball) => {
            const { when } = settings;
            const { name, level, items, types } = encounteredPokemon;

            return when.every((condition) => {
                switch (condition.type) {
                    case 'always':
                        return true;
                    case 'name':
                        return evaluateCondition(condition, name)
                    case 'shiny':
                        return evaluateCondition({ startsWith: 'shiny' }, name);
                    case 'starter':
                        return evaluateCondition({ in: STARTERS }, name);
                    case 'types':
                        return evaluateCondition(condition, types);
                    case 'level':
                        return evaluateCondition(condition, level);
                    case 'itemCount':
                        return evaluateCondition(condition, items.length);
                    case 'items':
                        return evaluateCondition(condition, items);
                    case 'chance':
                        return evaluateCondition(condition, pokeball.chance);
                }
            })
        })
        .sort((a, b) => {
            const vA = a[settings.best];
            const vB = b[settings.best];
            return vB - vA > 0 ? 1 : vA - vB > 0 ? -1 : 0;
        });

    const best = pokeballs[0];
    return best || null;
}
