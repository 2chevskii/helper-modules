import * as fs from 'fs'
import { join } from 'path'

const logfolder = './logs'

export class LogHandler {
    private logfile: string;
    constructor(logfilename: string = 'bot') {
        this.logfile = logfilename;
    }

    private checkLogFile() {
        if (!fs.existsSync(logfolder)) {
            fs.mkdirSync(logfolder);
        }
        if (!fs.existsSync(this.logFilePath)) {
            fs.writeFileSync(this.logFilePath, '')
        }
    }

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

    writeLog(data: any, timestamp: boolean = true) {
        process.stdout.write(`${timestamp ? this.formatLog(data.toString()) : data.toString()}\n`, 'utf-8');
    }

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

    private formatLog(log: string) {
        return `${this.timestamp} ${log}`
    }

    private get timestamp() {
        var obj = this.timeObject;
        return `[${obj.hour}:${obj.minute}:${obj.second}]`
    }

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

    private get logfileName() {
        let obj = this.timeObject;
        return `${this.logfile}_${obj.year}_${obj.month}_${obj.day}.log`
    }

    private get logFilePath() {
        return join(logfolder, this.logfileName);
    }
}