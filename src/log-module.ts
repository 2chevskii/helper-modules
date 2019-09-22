import * as fs from 'fs'
import * as path from 'path'

export namespace Log {

    const logFolder = `.${path.sep}helper-modules${path.sep}logs`

    const defaultprefix = 'log'

    /**
     *
     *
     * @export
     * @param {string} newprefix
     * @returns {boolean}
     */
    export function setPrefix(newprefix: string): boolean {
        for (let i = 0; i < newprefix.length; i++) {
            const char = newprefix[i]
            if (Log.Utility.reservedCharacters.includes(char)) {
                return false
            }
        }
        LogInternal.Instance.setFilePrefix(newprefix)
        return true
    }

    /**
     *
     *
     * @export
     * @param {number} [count=10]
     * @returns {LogMessage[]}
     */
    export function showLastLog(count: number = 10): LogMessage[] {
        return LogInternal.Instance.showLastLog(count)
    }

    /**
     *
     *
     * @export
     * @param {*} data
     * @param {boolean} [timestamp=true]
     * @param {boolean} [toConsole=true]
     * @param {boolean} [toFile=true]
     * @returns {LogMessage}
     */
    export function log(data: any, timestamp: boolean = true, toConsole: boolean = true, toFile: boolean = true): LogMessage {
        return LogInternal.Instance.log(data, timestamp, toConsole, toFile)
    }

    /**
     *
     *
     * @export
     * @param {*} data
     * @param {boolean} [timestamp=true]
     * @param {boolean} [toConsole=true]
     * @param {boolean} [toFile=true]
     * @returns {LogMessage}
     */
    export function logWarning(data: any, timestamp: boolean = true, toConsole: boolean = true, toFile: boolean = true): LogMessage {
        return LogInternal.Instance.logWarning(data, timestamp, toConsole, toFile)
    }

    /**
     *
     *
     * @export
     * @param {*} data
     * @param {boolean} [timestamp=true]
     * @param {boolean} [toConsole=true]
     * @param {boolean} [toFile=true]
     * @returns {LogMessage}
     */
    export function logError(data: any, timestamp: boolean = true, toConsole: boolean = true, toFile: boolean = true): LogMessage {
        return LogInternal.Instance.logError(data, timestamp, toConsole, toFile)
    }

    /**
     *
     *
     * @export
     * @param {string} data
     * @param {string} filepath
     * @returns {Promise<string>}
     */
    export async function logToFile(data: string, filepath: string): Promise<string> {
        return LogInternal.Instance.logToFile(data, filepath)
    }

    /**
     *
     *
     * @interface LogMessage
     */
    interface LogMessage {
        type: LogType
        message: string | undefined
        time: Log.Utility.TimeStamp | undefined
        toFile: boolean
        toConsole: boolean
    }

    /**
     *
     *
     * @enum {number}
     */
    enum LogType {
        Default,
        Warning,
        Error
    }


    /**
     *
     *
     * @class LogInternal
     */
    class LogInternal {
        private file: string
        private lastLog: Array<LogMessage>
        private static _instance: LogInternal

        /**
         *Creates an instance of LogInternal.
         * @param {string} file
         * @memberof LogInternal
         */
        public constructor(file: string) {
            this.file = file
            this.lastLog = new Array<LogMessage>()
        }

        /**
         *
         *
         * @param {string} newprefix
         * @memberof LogInternal
         */
        public setFilePrefix(newprefix: string) {
            this.file = newprefix
        }

        /**
         *
         *
         * @param {number} count
         * @returns {Array<LogMessage>}
         * @memberof LogInternal
         */
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

        /**
         *
         *
         * @param {*} data
         * @param {boolean} timestamp
         * @param {boolean} toConsole
         * @param {boolean} toFile
         * @returns {LogMessage}
         * @memberof LogInternal
         */
        public log(data: any, timestamp: boolean, toConsole: boolean, toFile: boolean): LogMessage {
            return this.logColored(data, LogType.Default, timestamp, toConsole, toFile)
        }


        /**
         *
         *
         * @param {*} data
         * @param {boolean} timestamp
         * @param {boolean} toConsole
         * @param {boolean} toFile
         * @returns {LogMessage}
         * @memberof LogInternal
         */
        public logWarning(data: any, timestamp: boolean, toConsole: boolean, toFile: boolean): LogMessage {
            return this.logColored(data, LogType.Warning, timestamp, toConsole, toFile)
        }


        /**
         *
         *
         * @param {*} data
         * @param {boolean} timestamp
         * @param {boolean} toConsole
         * @param {boolean} toFile
         * @returns {LogMessage}
         * @memberof LogInternal
         */
        public logError(data: any, timestamp: boolean, toConsole: boolean, toFile: boolean): LogMessage {
            return this.logColored(data, LogType.Error, timestamp, toConsole, toFile)
        }

        /**
         * 
         *
         * @param {string} data
         * @param {string} filepath
         * @returns {Promise<string>}
         * @memberof LogInternal
         */
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

        /**
         * Composes new log entry and performs actions (print to console / write to file) with it.
         *
         * @private
         * @param {*} data Any object which has a `toString()` method.
         * @param {LogType} type Type of the log entry.
         * @param {boolean} timestamp Current time.
         * @param {boolean} toConsole Should log entry be printed to console?
         * @param {boolean} toFile Should log entry be written to file?
         * @returns {LogMessage} Composed log entry.
         * @memberof LogInternal
         */
        private logColored(data: any, type: LogType, timestamp: boolean, toConsole: boolean, toFile: boolean): LogMessage {
            var ts = timestamp ? new Log.Utility.TimeStamp() : undefined
            var string: string | undefined = data === undefined ? undefined : data.toString()
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

        /**
         * Prints colored message to console.
         *
         * @private
         * @param {LogMessage} message Message to print.
         * @memberof LogInternal
         */
        private writeColored(message: LogMessage) {
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

        /**
         * Saves given `LogMessage` object to the default logfile.
         *
         * @private
         * @param {LogMessage} message Message object that needs to be saved.
         * @memberof LogInternal
         */
        private writeFile(message: LogMessage):void {
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

        /**
         * Returns path to the logfile for the current date.
         *
         * @readonly
         * @private
         * @type {string} Logfile path.
         * @memberof LogInternal
         */
        private get logFileName(): string {
            var ts = new Log.Utility.TimeStamp()
            return path.join(logFolder, this.file + '_' + ts.day + '_' + ts.month + '_' + ts.year + '.log')
        }

        /**
         * Ensures that `LangInternal` object exists before accessing it's members.
         *
         * @readonly
         * @static
         * @memberof LogInternal
         */
        public static get Instance() {
            if (LogInternal._instance === undefined) {
                LogInternal._instance = new LogInternal(defaultprefix)
            }
            return LogInternal._instance
        }
    }
}

export namespace Log.Utility {

    const _reservedCharacters = ["'", '"', '?', ':', '/', '\\', '>', '<', '*', '%', '|', ' ', '.', ',']

    /**
     * These characters could not be used in filepaths to avoid problems.
     */
    export const reservedCharacters = [..._reservedCharacters]

    /**
     * Represents current time in friendly form.
     * 
     * Properties:
     * * day:`number`
     * * month:`number`
     * * hour:`number`
     * * minute:`number`
     * * second:`number`
     * 
     * Methods:
     * * toString():`string`
     * 
     * Static methods:
     * * toString(`TimeStamp`):`string`
     */
    export class TimeStamp {
        public readonly day: number
        public readonly month: number
        public readonly year: number
        public readonly hour: number
        public readonly minute: number
        public readonly second: number

        /**
         * Creates an instance of TimeStamp.
         * @memberof TimeStamp
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
         *
         * @returns {string} Timecode in form `[hour:minute:second]`
         * @memberof TimeStamp 
         */
        public toString(): string {
            return TimeStamp.toString(this)
        }

        /**
         * Get string representation of a timestamp.
         *
         * @static
         * @param {TimeStamp} timestamp Input timestamp object
         * @returns {string} Timecode in form `[hour:minute:second]`
         * @memberof TimeStamp
         */
        public static toString(timestamp: TimeStamp): string {
            var string = '[' + timestamp.hour + ':' + timestamp.minute + ':' + timestamp.second + ']'
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