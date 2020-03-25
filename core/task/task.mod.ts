import { TASK } from "../constants.js";
import type { Task } from "../types";
import { HealLeader } from "./heal_leader.js";
import { Wait } from "./wait.js";
import { Login } from "./login.js";
import { BankDeposit } from "./bank_deposit.js";
import { BankWithdraw } from "./bank_withdraw.js";
import { SellPokemons } from "./sell_pokemons.js";
import { EvolvePokemons } from "./evolve_pokemons.js";

export function getTask (task: TASK): Task {
    switch (task) {
        case TASK.HEAL: return HealLeader;
        case TASK.WAIT: return Wait;
        case TASK.LOGIN: return Login;
        case TASK.BANK_DEPOSIT: return BankDeposit;
        case TASK.BANK_WITHDRAW: return BankWithdraw;
        case TASK.SELL_POKEMONS: return SellPokemons;
        case TASK.EVOLVE_POKEMONS: return EvolvePokemons;
    }
}
