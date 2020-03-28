export const CACHE_DIR_NAME = '.cache';
export const STATIC_DIR_NAME = 'static';
export const CONFIG_FILE_NAME = 'config.json';
export const CONFIG_SCHEMA_FILE_NAME = 'config.json';

export const enum ROUTE {
    TEAM = 'druzyna',
    BANK = 'depozyt',
    BREEDING = 'hodowla',
    HOSPITAL = 'lecznica',
    POKE_STATE = 'stan',
    WORK = 'praca',
    START = 'start',
    INVENTORY = 'plecak',
};

export const enum TASK {
    EVOLVE_POKEMONS = 'task-evolve-pokemons',
    SELL_POKEMONS = 'task-sell-pokemons',
    BANK_DEPOSIT = 'task-deposit-money',
    BANK_WITHDRAW = 'task-withdraw-money',
    HEAL = 'task-heal-leader',
    HUNT = 'task-hunt',
    WAIT = 'task-wait',
    REFILL_PA = 'task-refill-pa',
};

export const enum POKEBALL {
    NETBALL = 'netball',
    LEVELBALL = 'levelball',
};

export const enum HUNT_RESULT {
    POKEMON_ENCOUNTER = 'hunt-result-pokemon-encounter',
    POKEMON_EGG = 'hunt-result-pokemon-egg',
    ITEM = 'hunt-result-item',
    TEAM_FIGHT = 'hunt-result-team-fight',
    TRADER = 'hunt-result-trader',
    MOVE_TUTOR = 'hunt-result-move-tutor',
    NOTHING = 'hunt-result-nothing',
};

