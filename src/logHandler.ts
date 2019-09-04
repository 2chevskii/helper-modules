import * as fs from 'fs'
import { join } from 'path'

/** Folder which contains logs. Not intended to be modified, but probably won't do any harm if you change it */
const logfolder = './logs'

/**
 * General export class, instantiate this if you want to use module functionality
 */
export class LogHandler {
    /** Prefix for log file name */
    private logfile: string;
    /**
     * Initializes new LogHandler object
     * @param {string | undefined} logfilename override default log file name prefix (`bot`)
     */
    constructor(logfilename: string = 'bot') {
        this.logfile = logfilename;
    }

    /** Check if logifile for current time exists */
    private checkLogFile() {
        if (!fs.existsSync(logfolder)) {
            fs.mkdirSync(logfolder);
        }
        if (!fs.existsSync(this.logFilePath)) {
            fs.writeFileSync(this.logFilePath, '')
        }
    }

    /**
     * Returns `number` of log entries (`10` by default). *Safe to pass argument bigger than the existing log*
     * @param {number} count Max number of log entries to return
     * @returns {string[]} Array of log entries
     */
    showLog(count: number = 10) {
        this.checkLogFile();
        var log = fs.readFileSync(this.logFilePath, {
            encoding: 'utf-8',
            flag: 'r'
        }).split('\n');
        var array = new Array<string>();
        for (let index = 0; index < Math.min(count, log.length); index++) {
            array.push(log[index])
        }
        return array.reverse();
    }

    /**
     * Print log into Node.js console, optionally with a timestamp
     * @param {any} data Data, convertible to string
     * @param {boolean | undefined} timestamp Set to false, if you don't want to add timestamp to the log entry
     */
    writeLog(data: any, timestamp: boolean = true) {
        process.stdout.write(`${timestamp ? this.formatLog(data.toString()) : data.toString()}\n`, 'utf-8');
    }

    /**
     * Write log into current log file, optionally to console
     * @param {any} data Data, convertible to string
     * @param {boolean | undefined} timestamp Set to false, if you don't want to add timestamp to the log entry
     * @param {boolean | undefined} toConsole Set to false, if you don't want to output log entry to console
     */
    writeLogFile(data: any, timestamp: boolean = true, toConsole: boolean = true) {
        let str = data.toString();
        if (timestamp) {
            str = this.formatLog(str);
        }

        if (toConsole) {
            this.writeLog(str, false);
        }

        this.checkLogFile();
        fs.appendFileSync(this.logFilePath, '\n' + str);

    }

    /** Appends timestamp to the message */
    private formatLog(log: string) {
        return `${this.timestamp} ${log}`
    }

    /** Get current timestamp */
    private get timestamp() {
        var obj = this.timeObject;
        return `[${obj.hour}:${obj.minute}:${obj.second}]`
    }

    /** Get object representing current date and time */
    private get timeObject() {
        let date = new Date();
        let yr = date.getFullYear();
        let month = date.getMonth();
        let day = date.getDay();
        let hr = date.getHours();
        let min = date.getMinutes();
        let s = date.getSeconds();
        let ms = date.getMilliseconds();

        return { year: yr, month: month, day: day, hour: hr, minute: min, second: s, millisecond: ms }
    }

    /** Get current logfile name */
    private get logfileName() {
        let obj = this.timeObject;
        return `${this.logfile}_${obj.year}_${obj.month}_${obj.day}.log`
    }

    /** Get current logfile path */
    private get logFilePath() {
        return join(logfolder, this.logfileName);
    }
}