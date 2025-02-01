// Runtime Logger - log to console and file
// available in global scope as 'logger'
import winston from "winston";
import config from '../config';
import fs from 'fs';

try {
    fs.mkdirSync('logs');
} catch {
}

interface GlobalLogger extends winston.Logger {
    info(message?: unknown): winston.Logger;
    warn(message?: unknown): winston.Logger;
    error(message?: unknown): winston.Logger;
    logError(error: Error, meta?: string): void;
}

declare global {
    // eslint-disable-next-line no-var
    var logger: GlobalLogger;
}

// func used in loggerExt.logError
function stringifyError(err: unknown): string | null {
    if (err == null || !(err instanceof Error)) {
        return null;
    }

    let properties;
    if (Object.keys(err).length > 0) {
        let obj = {...err};
        properties = `\nProperties: ${JSON.stringify(obj)}`;
    } else {
        properties = '';
    }
    
    let cause;
    if (err.cause != null) {
        cause = `\nCaused by: ${stringifyError(err.cause)}`;
    } else {
        cause = '';
    }
    
    return `${err.stack}${properties}${cause}`;
}

// create logger and overload [info, warn, error]
const logger = winston.createLogger({
    transports: [ new winston.transports.File({ filename: config.runtimeLogFile }) ],
    handleExceptions: true,
    format: winston.format.combine(winston.format.timestamp(), winston.format.printf((info) => {
        return `[${info.timestamp}] [${info.level}] ${info.message}`;
    })),
});

const loggerExt = {
    _logger: logger,
    info(message?: unknown): winston.Logger {
        console.log(message);
        this._logger.info(message);
        return this._logger;
    },
    warn(message?: unknown): winston.Logger {
        console.warn(message);
        this._logger.warn(message);
        return this._logger;
    },
    error(message?: unknown): winston.Logger {
        console.error(message);
        this._logger.error(message);
        return this._logger;
    },
    logError(error: Error, meta?: string): void {
        this.error(`${meta}: ${stringifyError(error)}`);
    },
};
Object.setPrototypeOf(loggerExt, logger);

global.logger = loggerExt as unknown as GlobalLogger;
