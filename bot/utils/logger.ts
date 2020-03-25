import * as Pino from 'pino';

export const logger: ReturnType<typeof Pino> = (Pino as any).default();
logger.level = process.env.BOT_LOG_LEVEL || 'debug';
