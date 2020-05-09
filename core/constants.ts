export const CACHE_DIR_NAME = '.cache';
export const STATIC_DIR_NAME = 'static';
export const CONFIG_FILE_NAME = 'config.json';
export const JOURNAL_DIR_NAME = 'journal';
export const STATS_DIR_NAME = 'stats';

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
    'types',
    'itemCount',
    'items',
] as const;

export const POKEMON_POKEBOX_CONDITION = [
    'shiny',
    'name',
    'level',
] as const;

export const CONDITION_KEYWORD = [
    'eq',
    'gt',
    'lt',
    'includes',
    'in',
    'startsWith',
    'some',
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

export const enum EVENT {
    SELL_POKEMONS = 'event-sell-pokemons',
    WAIT = 'event-wait',
    DEPOSIT = 'event-deposit',
    WITHDRAW = 'event-withdraw',
    EVOLVE_POKEMONS = 'event-evolve-pokemons',
    HEAL = 'event-heal',
    HUNT = 'event-hunt',
    ENCOUNTER_POKEMON = 'event-encounter-pokemon',
    ENCOUNTER_ITEM = 'event-encounter-item',
    ENCOUNTER_NOTHING = 'event-encounter-nothing',
    THROW_POKEBALL = 'event-throw-pokeball',
    THROW_SUCCESSFUL = 'event-throw-successfull',
};
