import * as fs from 'fs'
import * as path from 'path'

/**
 * @namespace {Log} Log
 */
export namespace Log {

    const logFolder = `.${path.sep}helper-modules${path.sep}logs`

    const defaultprefix = 'log'

    /**
     * Set new prefix for the log file. Note that prefix cannot contain certain characters (listed in `Log.Utility.reservedCharacters`).
     * @function
     * @export
     * @param {string} prefix New log file prefix.
     * @returns {boolean} Whether new prefix is set or not.
     * @memberof Log
     */
    export function setPrefix(prefix: string): boolean {
        for (let i = 0; i < prefix.length; i++) {
            const char = prefix[i]
            if (Log.Utility.reservedCharacters.includes(char)) {
                return false
            }
        }
        LogInternal.Instance.setFilePrefix(prefix)
        return true
    }

    /**
     * Get last log entries.
     * 
     * *Importnant:* This function works only with log of current session (stored in memory). It won't ever return values from previous sessions (even if they are saved into file).
     * @function
     * @export
     * @param {number} [count=10] Maximum count of log entries you want to get. Real given amount might be less than this number.
     * @returns {LogMessage[]} Array with log messages. *Could be 0 length but never `undefined/null`*
     * @memberof Log
     */
    export function showLastLog(count: number = 10): LogMessage[] {
        return LogInternal.Instance.showLastLog(count)
    }

    /**
     * Write log with default console color.
     * @function
     * @export
     * @param {*} data Object to log. *Note that function should be able to cast this value to a string, if it can not, an exception will be thrown.*
     * @param {boolean} [timestamp=true] Whether the function should attach a timestamp (`[hour:min:sec]`) in front of the log message. (`true` by default)
     * @param {boolean} [toConsole=true] Whether the function should print log entry into `stdin`. (`true` by default)
     * @param {boolean} [toFile=true] Whether the function should save this log into default logfile. (`true` by default)
     * @returns {LogMessage} Composed `LogMessage` object.
     * @memberof Log
     */
    export function log(data: any, timestamp: boolean = true, toConsole: boolean = true, toFile: boolean = true): LogMessage {
        return LogInternal.Instance.log(data, timestamp, toConsole, toFile)
    }

    /**
     * Write log highlighted in yellow.
     * @function
     * @export
     * @param {*} data Object to log. *Note that function should be able to cast this value to a string, if it can not, an exception will be thrown*
     * @param {boolean} [timestamp=true] Whether the function should attach a timestamp (`[hour:min:sec]`) in front of the log message. (`true` by default)
     * @param {boolean} [toConsole=true] Whether the function should print log entry into `stdin`. (`true` by default)
     * @param {boolean} [toFile=true] Whether the function should save this log into default logfile. (`true` by default)
     * @returns {LogMessage} Composed `LogMessage` object.
     * @memberof Log
     */
    export function logWarning(data: any, timestamp: boolean = true, toConsole: boolean = true, toFile: boolean = true): LogMessage {
        return LogInternal.Instance.logWarning(data, timestamp, toConsole, toFile)
    }

    /**
     * Write log highlighted in red.
     * @function
     * @export
     * @param {*} data Object to log. *Note that function should be able to cast this value to a string, if it can not, an exception will be thrown*
     * @param {boolean} [timestamp=true] Whether the function should attach a timestamp (`[hour:min:sec]`) in front of the log message. (`true` by default)
     * @param {boolean} [toConsole=true] Whether the function should print log entry into `stdin`. (`true` by default)
     * @param {boolean} [toFile=true] Whether the function should save this log into default logfile. (`true` by default)
     * @returns {LogMessage} Composed `LogMessage` object.
     * @memberof Log
     */
    export function logError(data: any, timestamp: boolean = true, toConsole: boolean = true, toFile: boolean = true): LogMessage {
        return LogInternal.Instance.logError(data, timestamp, toConsole, toFile)
    }

    /**
     * Writes data to the specified file.
     * @function
     * @async
     * @export
     * @param {string} data Object to log. *Note that function should be able to cast this value to a string, if it can not, an exception will be thrown*
     * @param {string} filepath Path to the file. *If it is somehow incorrect, promise will return an error message*
     * @returns {Promise<string>} Promise with message about successfullness of the operation
     * @memberof Log
     */
    export async function logToFile(data: string, filepath: string): Promise<string> {
        return LogInternal.Instance.logToFile(data, filepath)
    }

    interface LogMessage {
        type: LogType
        message: string | undefined
        time: Log.Utility.TimeStamp | undefined
        toFile: boolean
        toConsole: boolean
    }

    enum LogType {
        Default = 'default',
        Warning = 'warning',
        Error = 'error'
    }

    class LogInternal {
        private file: string
        private lastLog: Array<LogMessage>
        private static _instance: LogInternal

        public constructor(file: string) {
            this.file = file
            this.lastLog = new Array<LogMessage>()
        }

        public setFilePrefix(prefix: string): void {
            this.file = prefix
        }

        public showLastLog(count: number): Array<LogMessage> {
            var array = new Array<LogMessage>(0)
            var i = 0
            this.lastLog.reverse().forEach(msg => {
                if (i === count) {
                    return array
                }
                array.push(msg)
            })
            return array
        }

        public log(data: any, timestamp: boolean, toConsole: boolean, toFile: boolean): LogMessage {
            return this.logColored(data, LogType.Default, timestamp, toConsole, toFile)
        }

        public logWarning(data: any, timestamp: boolean, toConsole: boolean, toFile: boolean): LogMessage {
            return this.logColored(data, LogType.Warning, timestamp, toConsole, toFile)
        }

        public logError(data: any, timestamp: boolean, toConsole: boolean, toFile: boolean): LogMessage {
            return this.logColored(data, LogType.Error, timestamp, toConsole, toFile)
        }

        public async logToFile(data: string, filepath: string): Promise<string> {
            return new Promise((resolve, reject) => {
                try {
                    var dir = path.dirname(filepath)
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true })
                    }
                    fs.appendFile(filepath, data + '\n', (ex) => {
                        if (ex != null) {
                            reject(`Could not write log message into file (${filepath}): ${ex}`)
                        }
                        else {
                            resolve('Log was successfully written to: ' + filepath)
                        }
                    })
                } catch (ex) {
                    reject(`Could not write log message into file (${filepath}): ${ex}`)
                }
            })
        }

        private logColored(data: any, type: LogType, timestamp: boolean, toConsole: boolean, toFile: boolean): LogMessage {
            const ts = timestamp ? new Log.Utility.TimeStamp() : undefined
            const string: string | undefined = data === undefined ? undefined : data.toString()
            var message: LogMessage = {
                message: string,
                time: ts,
                toConsole: toConsole,
                toFile: toFile,
                type: type
            }
            if (toConsole) {
                this.writeColored(message)
            }
            if (toFile) {
                this.writeFile(message)
            }

            this.lastLog.push(message)

            return message
        }

        private writeColored(message: LogMessage): void {
            var msg = message.message === undefined ? 'undefined' : message.message
            switch (message.type) {
                case LogType.Warning:
                    msg = "\x1b[33m" + msg + '\x1b[0m'
                    break;

                case LogType.Error:
                    msg = "\x1b[31m" + msg + '\x1b[0m'
                    break;
            }
            if (message.time !== undefined) {
                msg = "\x1b[32m" + message.time.toString() + '\x1b[0m' + ' ' + msg
            }
            process.stdout.write(msg + '\n', 'utf-8', (ex) => { if (ex != null) { this.logError(ex, true, true, true) } })
        }

        private writeFile(message: LogMessage): void {
            var msg = message.message === undefined ? 'undefined' : message.message
            switch (message.type) {
                case LogType.Warning:
                    msg = '[WARNING] ' + msg
                    break;

                case LogType.Error:
                    msg = '[ERROR] ' + msg
                    break;
            }
            if (message.time !== undefined) {
                msg = message.time.toString() + ' ' + msg
            }
            this.logToFile(msg, this.logFileName).catch(ex => this.logError(ex, true, true, false))
        }

        private get logFileName(): string {
            const ts = new Log.Utility.TimeStamp()
            return path.join(logFolder, this.file + '_' + ts.day + '_' + ts.month + '_' + ts.year + '.log')
        }

        public static get Instance(): LogInternal {
            if (LogInternal._instance === undefined) {
                LogInternal._instance = new LogInternal(defaultprefix)
            }
            return LogInternal._instance
        }
    }
}

/**
 * @namespace Log.Utility
 * @memberof Log
 */
export namespace Log.Utility {

    const _reservedCharacters = ["'", '"', '?', ':', '/', '\\', '>', '<', '*', '%', '|', ' ', '.', ',']

    /**
     * These characters could not be used in filepaths to avoid problems.
     * @export
     * @type {string[]}
     * @constant
     * @memberof Log.Utility
     */
    export const reservedCharacters = [..._reservedCharacters]

    /**
     * Represents current time in friendly form.
     * @export
     * @class TimeStamp
     * @memberof Log.Utility
     */
    export class TimeStamp {
        /**
         * @public
         * @readonly
         * @type {number}
         * @memberof Log.Utility.TimeStamp
         */
        public readonly day: number
        /**
         * @public
         * @readonly
         * @type {number}
         * @memberof Log.Utility.TimeStamp
         */
        public readonly month: number
        /**
         * @public
         * @readonly
         * @type {number}
         * @memberof Log.Utility.TimeStamp
         */
        public readonly year: number
        /**
         * @public
         * @readonly
         * @type {number}
         * @memberof Log.Utility.TimeStamp
         */
        public readonly hour: number
        /**
         * @public
         * @readonly
         * @type {number}
         * @memberof Log.Utility.TimeStamp
         */
        public readonly minute: number
        /**
         * @public
         * @readonly
         * @type {number}
         * @memberof Log.Utility.TimeStamp
         */
        public readonly second: number

        /**
         * Creates an instance of TimeStamp.
         * @public
         * @constructor
         * @type {Log.Utility.TimeStamp}
         * @memberof Log.Utility.TimeStamp
         */
        public constructor() {
            var date = new Date()
            this.day = date.getDate()
            this.month = date.getMonth()
            this.year = date.getFullYear()
            this.hour = date.getHours()
            this.minute = date.getMinutes()
            this.second = date.getSeconds()
        }

        /**
         * Get string representation of a timestamp.
         * @method
         * @public
         * @returns {string} Timecode in form [hour:minute:second]
         * @memberof Log.Utility.TimeStamp
         */
        public toString(): string {
            return TimeStamp.toString(this)
        }

        /**
         * Get string representation of a timestamp.
         * @method
         * @public
         * @static
         * @param {TimeStamp} timestamp Input timestamp object
         * @returns {string} Timecode in form [hour:minute:second]
         * @memberof Log.Utility.TimeStamp
         */
        public static toString(timestamp: TimeStamp): string {
            const string = '[' + timestamp.hour + ':' + timestamp.minute + ':' + timestamp.second + ']'
            return string
        }
    }
}

export default Log

/*
Reset = "\x1b[0m"
Bright = "\x1b[1m"
Dim = "\x1b[2m"
Underscore = "\x1b[4m"
Blink = "\x1b[5m"
Reverse = "\x1b[7m"
Hidden = "\x1b[8m"

FgBlack = "\x1b[30m"
FgRed = "\x1b[31m"
FgGreen = "\x1b[32m"
FgYellow = "\x1b[33m"
FgBlue = "\x1b[34m"
FgMagenta = "\x1b[35m"
FgCyan = "\x1b[36m"
FgWhite = "\x1b[37m"

BgBlack = "\x1b[40m"
BgRed = "\x1b[41m"
BgGreen = "\x1b[42m"
BgYellow = "\x1b[43m"
BgBlue = "\x1b[44m"
BgMagenta = "\x1b[45m"
BgCyan = "\x1b[46m"
BgWhite = "\x1b[47m"
*/
