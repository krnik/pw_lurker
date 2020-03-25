import type { Task } from '../../core/types';
import {TASK} from '../constants.js';
import {props, is, some} from '../utils.js';

const USER_INPUT = '[name=login]';
const PASS_INPUT = '[name=pass]';
const SUBMIT_BTN = '[name=zaloguj]';

export const Login: Task = {
    name: TASK.LOGIN,
    async perform (app, params) {
        const [login, password] = props(some(params), ['login', 'password']).map(is.str);
        
        await app.page.type(USER_INPUT, login);
        await app.page.type(PASS_INPUT, password);
        await app.page.clickNavigate(SUBMIT_BTN);
    },
};
