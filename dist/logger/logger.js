// src/utils/logger.ts
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import chalk from 'chalk';
// Définir les niveaux de log avec des couleurs personnalisées
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        debug: 'blue',
    },
};
// Appliquer les couleurs définies aux niveaux de log
import { addColors } from 'winston';
addColors(customLevels.colors);
// Créer le logger
const logger = createLogger({
    levels: customLevels.levels,
    format: format.combine(format.colorize({ all: true }), format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.printf((info) => {
        const timestamp = chalk.gray(info.timestamp);
        let level;
        let icon;
        switch (info.level) {
            case 'error':
                level = chalk.red.bold(info.level.toUpperCase());
                icon = '❌';
                break;
            case 'warn':
                level = chalk.yellow.bold(info.level.toUpperCase());
                icon = '⚠️';
                break;
            case 'info':
                level = chalk.green.bold(info.level.toUpperCase());
                icon = 'ℹ️';
                break;
            case 'http':
                level = chalk.magenta.bold(info.level.toUpperCase());
                icon = '📡';
                break;
            case 'debug':
                level = chalk.blue.bold(info.level.toUpperCase());
                icon = '🐞';
                break;
            default:
                level = info.level.toUpperCase();
                icon = '';
        }
        return `${timestamp} [${level}] ${icon}: ${info.message}`;
    })),
    transports: [
        new transports.Console(),
        new DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: 'info',
        }),
    ],
});
export default logger;
