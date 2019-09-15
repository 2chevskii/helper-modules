import * as fs from 'fs'
import { join } from 'path'

export namespace Log {
    
    const handlers = new Array<Log.Internal.LogHandlerInternal>()

    const logfolder = './logs'

    const _reservedCharacters = ["'", '"', '?', ':', '/', '\\', '>', '<', '*', '%', '|', ' ', '.', ',']

    export const ReservedCharacters = (() => {
        var array = new Array<string>()
        _reservedCharacters.forEach(char => array.push(char))
        return array
    })()

    interface TimeStamp {
        year: number;
        month: number;
        day: number;
        hour: number;
        minute: number;
        second: number;
        millisecond: number;
    }

    export class LogHandler {
        constructor(logfilename?: string) {
            var handler = new Log.Internal.LogHandlerInternal(logfilename)
            handlers[this.toString()] = handler
        }

        showLog(count: number = 10): string[] {
            return handlers[this.toString()].showLog(count)
        }

        writeLog(data: any, timestamp: boolean = true): void {
            handlers[this.toString()].writeLog(data, timestamp)
        }

        writeLogFile(data: any, timestamp: boolean = true, toConsole: boolean = true): void {
            handlers[this.toString()].writeLogFile(data, timestamp, toConsole)
        }
    }

    namespace Log.Internal {
        export class LogHandlerInternal {
            private logfileprefix: string

            constructor(logfilename?: string) {
                if (logfilename != undefined) {
                    for (let i = 0; i < logfilename.length; i++) {
                        const char = logfilename[i]
                        if (_reservedCharacters.includes(char)) {
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

            writeLog(data: any, timestamp: boolean = true): void {
                var log = `${timestamp ? this.formatLog(data.toString()) : data.toString()}\n`
                console.log(log)
            }

            writeLogFile(data: any, timestamp: boolean = true, toConsole: boolean = true): void {
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
                                this.writeLog(ex)
                            }
                            else {
                                fs.appendFile(this.logFilePath, str + '\r\n', {
                                    encoding: 'utf-8'
                                }, (ex) => {
                                    if (ex != null) {
                                        this.writeLog(ex)
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
                                this.writeLog(ex)
                            }
                        })
                    }
                })
            }

            private formatLog(log: string): string {
                return `${this.timestamp} ${log}`
            }

            private get timestamp(): string {
                var obj = this.timeObject;
                return `[${obj.hour}:${obj.minute}:${obj.second}]`
            }

            private get timeObject(): TimeStamp {
                let date = new Date()
                let yr = date.getFullYear()
                let month = date.getMonth()
                let day = date.getDate()
                let hr = date.getHours()
                let min = date.getMinutes()
                let s = date.getSeconds()
                let ms = date.getMilliseconds()

                return { year: yr, month: month, day: day, hour: hr, minute: min, second: s, millisecond: ms }
            }

            private get logfileName(): string {
                let obj = this.timeObject
                return `${this.logfileprefix}_${obj.year}_${obj.month}_${obj.day}.log`
            }

            private get logFilePath(): string {
                return join(logfolder, this.logfileName)
            }
        }
    }
}

export default Log