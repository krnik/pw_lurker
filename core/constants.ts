export const CACHE_DIR_NAME = '.cache';
export const STATIC_DIR_NAME = 'static';
export const CONFIG_FILE_NAME = 'config.json';
export const CONFIG_SCHEMA_FILE_NAME = 'config.schema.json';

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
    NO_AP = 'task-no-ap',
    WAIT = 'task-wait',
};

// export type POKEBS = typeof POKEBALLS[number];
export const POKEBALLS = {
    ALL: [
        'cherishball',
        'diveball',
        'fossilball',
        'friendball',
        'greatball',
        'levelball',
        'loveball',
        'lureball',
        'luxuryball',
        'masterball',
        'moonball',
        'nestball',
        'netball',
        'pokeball',
        'premierball',
        'repeatball',
        'shinyball',
        'starterball',
        'sunball',
        'swarmball',
        'timerball',
        'ultraball',
        'warsball',
    ],
    REPEATABLE: [
        'repeatball',
        'swarmball',
        'timerball',
    ],
} as const;

export const HEAL_METHOD = [
    'money',
    'juice',
    'herb',
    'wait',
] as const;

export const POKEBALL_CONDITION = [
    'always',
    'shiny',
    'starter',
    'chance',
    'name',
    'level',
] as const;

export const AP_REFILL_METOHD = [
    'wait',
    'junipier',
    'oak',
] as const;

// TODO: Move to hunt task and replace with type union { type: 'item', item: 'mony' }
export const enum HUNT_RESULT {
    POKEMON_ENCOUNTER = 'hunt-result-pokemon-encounter',
    POKEMON_EGG = 'hunt-result-pokemon-egg',
    ITEM = 'hunt-result-item',
    TEAM_FIGHT = 'hunt-result-team-fight',
    TRADER = 'hunt-result-trader',
    MOVE_TUTOR = 'hunt-result-move-tutor',
    NOTHING = 'hunt-result-nothing',
};

