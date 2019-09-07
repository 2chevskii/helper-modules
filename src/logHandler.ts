import * as fs from 'fs'
import { join } from 'path'

/**
 * Contains definitions which can be helpful for logging and debugging
 */
export namespace Log {

    /** Folder which contains logs. Not intended to be modified, but probably won't do any harm if you change it */
    const logfolder = './logs'

    /** These characters are prohibited to use in the filename to avoid problems */
    const reservedCharacters = ["'", '"', '?', ':', '/', '\\', '>', '<', '*', '%', '|', ' ', '.', ',']

    /**
     * Helps organize timestamps
     */
    export interface TimeStamp {
        year: number;
        month: number;
        day: number;
        hour: number;
        minute: number;
        second: number;
        millisecond: number;
    }

    /**
     * General export class, instantiate this if you want to use module functionality
     */
    export class LogHandler {
        /** Prefix for log file name */
        private logfileprefix: string
        /**
         * Initializes new LogHandler object
         * @param {string | undefined} logfilename override default log file name prefix (`bot`)
         */
        constructor(logfilename?: string) {
            // Setting the correct prefix
            if (logfilename != undefined) {
                for (let i = 0; i < logfilename.length; i++) {
                    const char = logfilename[i]
                    if (reservedCharacters.includes(char)) {
                        logfilename = undefined
                        break;
                    }
                }
            }
            if (logfilename == undefined) {
                logfilename = 'bot'
            }
            this.logfileprefix = logfilename
        }



        /**
         * Returns `number` of log entries (`10` by default). 
         * * *It is safe to pass argument bigger than the existing log*
         * * *Be aware, that because of writeLogFile function uses async, the most recent log entries could not be available all the time, try to give it some time to process*
         * @param {number} count Max number of log entries to return
         * @returns {string[]} Array of log entries
         */
        showLog(count: number = 10): string[] {
            const array = new Array<string>(0);
            if (!fs.existsSync(this.logFilePath)) {
                return array;
            }
            else {
                let str = fs.readFileSync(this.logFilePath, {
                    encoding: 'utf-8',
                    flag: 'r'
                })
                return str.split(/(\r|\n)/g).filter((str) => {
                    return str != '\n' && str != '\r' && str != ' ' && str != ''
                }).filter((str, i) => {
                    return i < count;
                })
            }
        }

        /**
         * Print log into Node.js console, optionally with a timestamp
         * @param {any} data Data, convertible to string
         * @param {boolean | undefined} timestamp Set to false, if you don't want to add timestamp to the log entry
         */
        writeLog(data: any, timestamp: boolean = true): void {
            var log = `${timestamp ? this.formatLog(data.toString()) : data.toString()}\n`
            console.log(log)
        }

        /**
         * Write log into current log file, optionally to console
         * @param {any} data Data, convertible to string
         * @param {boolean | undefined} timestamp Set to false, if you don't want to add timestamp to the log entry
         * @param {boolean | undefined} toConsole Set to false, if you don't want to output log entry to console
         */
        async writeLogFile(data: any, timestamp: boolean = true, toConsole: boolean = true): Promise<void> {
            let str = data.toString()
            if (timestamp) {
                str = this.formatLog(str)
            }

            if (toConsole) {
                this.writeLog(str, false)
            }

            fs.exists(logfolder, (exists) => {
                if (!exists) {
                    fs.mkdir(logfolder, (ex) => {
                        if (ex != null) {
                            console.error(ex);
                        }
                        else {
                            fs.appendFile(this.logFilePath, str + '\r\n', {
                                encoding: 'utf-8'
                            }, (ex) => {
                                if (ex != null) {
                                    console.error(ex)
                                }
                            })
                        }
                    })
                }
                else {
                    fs.appendFile(this.logFilePath, str + '\r\n', {
                        encoding: 'utf-8'
                    }, (ex) => {
                        if (ex != null) {
                            console.error(ex)
                        }
                    })
                }
            })
        }

        /** 
         * Appends timestamp to the message
         * @returns {string} `[HR:MIN:SEC] log`
         */
        private formatLog(log: string): string {
            return `${this.timestamp} ${log}`
        }

        /** 
         * Get current timestamp
         * @returns {string} Present time in `[HR:MIN:SEC]` format
         */
        private get timestamp(): string {
            var obj = this.timeObject;
            return `[${obj.hour}:${obj.minute}:${obj.second}]`
        }

        /** 
         * Get object representing current date and time
         * @returns {TimeStamp} Object containing current date:
         * * year
         * * month
         * * day
         * * hour
         * * minute
         * * second
         * * millisecond
         */
        private get timeObject(): TimeStamp {
            let date = new Date()
            let yr = date.getFullYear()
            let month = date.getMonth()
            let day = date.getDay()
            let hr = date.getHours()
            let min = date.getMinutes()
            let s = date.getSeconds()
            let ms = date.getMilliseconds()

            return { year: yr, month: month, day: day, hour: hr, minute: min, second: s, millisecond: ms }
        }

        /**
         * Get current logfileprefix name
         * @returns {string} New name for logfile in `prefix_YYYY_MM_DD.log` format
         */
        private get logfileName(): string {
            let obj = this.timeObject
            return `${this.logfileprefix}_${obj.year}_${obj.month}_${obj.day}.log`
        }

        /** 
         * Get current logfileprefix path
         * @returns {string} Generated path to corresponding logfile for present day
         */
        private get logFilePath(): string {
            return join(logfolder, this.logfileName)
        }
    }
}

export default Log