/**
 * Winston-based logging configuration for KryptoLuck
 * Provides structured logging with timestamps and multiple output formats
 */

import { createLogger, format, transports } from 'winston';
import { DateTime } from 'luxon';

/**
 * Configured Winston logger instance
 * 
 * Features:
 * - Configurable log level via LOG_LEVEL environment variable
 * - Console output with colors and timestamps
 * - JSON format for structured logging
 * - Error stack trace support
 * 
 * @type {import('winston').Logger}
 */
export const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.errors({stack: true}),
        format.splat(),
        format.json()
    ),
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize({all: true}),
                format.printf(function (info) {
                    let date = DateTime.now().toString().replace(/T/, ' ').slice(0, 23)
                    return `${date} [${info.level}]: ${info.message}`;
                })
            )
        })
    ]
});

export default {logger}