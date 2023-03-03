import { createLogger, format, transports } from 'winston';
import { DateTime } from 'luxon';
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
                    let date = DateTime.now().toString().replace(/T/, ' ').slice(0, 23) //.setZone('America/New_York')
                    return `${date} [${info.level}]: ${info.message}`;
                })
            )
        })
    ]
});

export default {logger}