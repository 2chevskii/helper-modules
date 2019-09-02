import * as fs from 'fs'

export class Logger {
    private logfile: string;
    constructor(logfilepath: string) {
        this.logfile = logfilepath;
    }

    Log(data: any, timestamp: boolean = true) {
        if (timestamp) {
            console.log(`${this.GetTimestamp()} ${data.toString()}`);
        }
        else {
            console.log(data.toString());
        }
    }

    LogToFile(data: any, timestamp: boolean = true, toConsole: boolean = true) {
        let log: string;
        if (timestamp) {
            log = `${this.GetTimestamp()} ${data.toString()}`;
        }
        else {
            log = data.toString();
        }

        if (toConsole) {
            this.Log(log, false);
        }

        if (!fs.existsSync(this.logfile)) {
            fs.writeFileSync(this.logfile, '---Start of the log file---');
        }

        fs.appendFileSync(this.logfile, '\n' + log);
    }

    GetTimestamp(withDate: boolean = false) {
        let date = new Date();
        let yr = date.getFullYear();
        let month = date.getMonth();
        let day = date.getDay();
        let hrs = date.getHours();
        let mins = date.getMinutes();
        let secs = date.getSeconds();

        if (!withDate) {
            return `[${hrs}:${mins}:${secs}]`;
        }
        else {
            return `[${day}.${month}.${yr} | ${hrs}:${mins}:${secs}]`;
        }
    }
}