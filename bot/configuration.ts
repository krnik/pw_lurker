import Ajv from "ajv";
import {resolveRoot} from "../core/paths.js";
import {CONFIG_FILE_NAME, JOURNAL_DIR_NAME, STATS_DIR_NAME} from "../core/constants.js";
import {readFileSync, existsSync, mkdirSync} from "fs";
import {logger} from "./utils/logger.js";
import { Config } from "../core/types.js";
import {configSchema} from "../core/schema.js";

function ensureDirExists (dirPath: string[]): void {
    const path = resolveRoot(dirPath);

    if (existsSync(path)) {
        return;
    }

    mkdirSync(path);
}

ensureDirExists([JOURNAL_DIR_NAME]);
ensureDirExists([STATS_DIR_NAME]);

const ajv: ReturnType<typeof Ajv> = new Ajv;

interface BotJsonConfig {
    accounts: Config.Core[];
}

const configPath = resolveRoot([CONFIG_FILE_NAME]);
const configData = JSON.parse(readFileSync(configPath).toString());
const validator = ajv.compile(configSchema);

if (!validator(configData)) {
    logger.fatal({ errors: validator.errors });
    throw new Error('Invalid Config');
}

export const configuration: BotJsonConfig = configData;

for (const acc of configuration.accounts) {
    ensureDirExists([JOURNAL_DIR_NAME, acc['user.login']]);
    ensureDirExists([STATS_DIR_NAME, acc['user.login']]);
}

