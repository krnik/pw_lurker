import * as Ajv from "ajv";
import {resolveRoot} from "../core/paths.js";
import {CONFIG_FILE_NAME, CONFIG_SCHEMA_FILE_NAME} from "../core/constants.js";
import {readFileSync} from "fs";
import {logger} from "./utils/logger.js";
import { Config } from "../core/types.js";

const ajv: ReturnType<typeof Ajv> = new (Ajv as any).default;

interface BotJsonConfig {
    accounts: Config.Core[];
}

const configPath = resolveRoot(['../../', CONFIG_FILE_NAME]);
const schemaPath = resolveRoot(['../../', CONFIG_SCHEMA_FILE_NAME]);

const configData = JSON.parse(readFileSync(configPath).toString());
const validator = ajv.compile(JSON.parse(readFileSync(schemaPath).toString()));

if (!validator(configData)) {
    logger.error({ errors: validator.errors });
    throw new Error('Invalid Config');
}

export const configuration: BotJsonConfig = configData;

