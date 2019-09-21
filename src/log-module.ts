import * as fs from 'fs'
import * as path from 'path'

export namespace Log {

    const logFolder = `.${path.sep}helper-modules${path.sep}logs`

    const defaultprefix = 'log'

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

    export function showLastLog(count: number = 10): LogMessage[] {
        return LogInternal.Instance.showLastLog(count)
    }

    export function log(data: any, timestamp: boolean = true, toConsole: boolean = true, toFile: boolean = true): LogMessage {
        return LogInternal.Instance.log(data, timestamp, toConsole, toFile)
    }

    export function logWarning(data: any, timestamp: boolean = true, toConsole: boolean = true, toFile: boolean = true): LogMessage {
        return LogInternal.Instance.logWarning(data, timestamp, toConsole, toFile)
    }
    export function logError(data: any, timestamp: boolean = true, toConsole: boolean = true, toFile: boolean = true): LogMessage {
        return LogInternal.Instance.logError(data, timestamp, toConsole, toFile)
    }

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
        Default,
        Warning,
        Error
    }

    class LogInternal {
        private file: string
        private lastLog: Array<LogMessage>
        private static _instance: LogInternal
        constructor(file: string) {
            this.file = file
            this.lastLog = new Array<LogMessage>()
        }

        setFilePrefix(newprefix: string) {
            this.file = newprefix
        }

        showLastLog(count: number): Array<LogMessage> {
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

        log(data: any, timestamp: boolean, toConsole: boolean, toFile: boolean): LogMessage {
            return this.logColored(data, LogType.Default, timestamp, toConsole, toFile)
        }

        logWarning(data: any, timestamp: boolean, toConsole: boolean, toFile: boolean): LogMessage {
            return this.logColored(data, LogType.Warning, timestamp, toConsole, toFile)
        }

        logError(data: any, timestamp: boolean, toConsole: boolean, toFile: boolean): LogMessage {
            return this.logColored(data, LogType.Error, timestamp, toConsole, toFile)
        }

        async logToFile(data: string, filepath: string): Promise<string> {
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

        private writeFile(message: LogMessage) {
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
            var ts = new Log.Utility.TimeStamp()
            return path.join(logFolder, this.file + '_' + ts.day + '_' + ts.month + '_' + ts.year + '.log')
        }

        static get Instance() {
            if (LogInternal._instance === undefined) {
                LogInternal._instance = new LogInternal(defaultprefix)
            }
            return LogInternal._instance
        }
    }
}

export namespace Log.Utility {

    const _reservedCharacters = ["'", '"', '?', ':', '/', '\\', '>', '<', '*', '%', '|', ' ', '.', ',']

    export const reservedCharacters = [..._reservedCharacters]

    export class TimeStamp {
        readonly day: number
        readonly month: number
        readonly year: number
        readonly hour: number
        readonly minute: number
        readonly second: number
        constructor() {
            var date = new Date()
            this.day = date.getDate()
            this.month = date.getMonth()
            this.year = date.getFullYear()
            this.hour = date.getHours()
            this.minute = date.getMinutes()
            this.second = date.getSeconds()
        }

        toString(): string {
            return TimeStamp.toString(this)
        }

        static toString(timestamp: TimeStamp): string {
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