import Pino from 'pino';

export const logger = Pino();
logger.level = process.env.BOT_LOG_LEVEL || 'debug';
