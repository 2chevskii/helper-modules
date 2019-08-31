import { Message } from 'discord.js'
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
        else{
            log = data.toString();
        }

        if(toConsole){
            this.Log(log, false);
        }

        if(!fs.existsSync(this.logfile)){
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

export class CommandHandler {
    private prefix: string;
    private commands: Array<Command>;
    private consoleCommands: Array<ConsoleCommand>;
    constructor(prefix: string) {
        this.prefix = prefix;
        this.commands = new Array<Command>();
        this.consoleCommands = new Array<ConsoleCommand>();
    }

    registerCommand(cmd : string, callback: (msg: Message, args?: string[]) => void){
        if(this.commands[cmd] == undefined){
            this.commands[cmd] = new Command(callback);
            return true;
        }
        return false;
    }

    registerConsoleCommand(cmd:string, callback: (args?: string[]) => void){
        if(this.consoleCommands[cmd] == undefined){
            this.consoleCommands[cmd] = new ConsoleCommand(callback);
            return true;
        }
        return false;
    }

    unregisterCommand(cmd : string, console: boolean){
        if (console) {
            if (this.consoleCommands[cmd] != undefined) {
                this.consoleCommands[cmd] = undefined;
                return true;
            }
            return false;
        }
        else{
            if (this.commands[cmd] != undefined) {
                this.commands[cmd] = undefined;
                return true; 
            }
            return false;
        }
    }

    handleChatMessage(msg: Message) {
        var resp = this.isCommand(msg.content);
        if (resp.isCmd) {
            var command = this.commands[resp.command] as Command;
            command.callback(msg, resp.args);
        }
    }

    handleConsoleCommand(command:string){
        var cmd= command.split(' ')[0]
        var args = this.parseArguments(command);
        var cc = this.consoleCommands[cmd] as ConsoleCommand;
        if (cc == undefined) {
            return false;
        }
        cc.callback(args);
        return true;
    }

    private isCommand(str: string) {
        var ret = {
            isCmd: false,
            command: '',
            args: new Array<string>()
        }
        if (!str.startsWith(this.prefix) || str.length < 2 || str[1] == ' ') {
            return ret;
        }
        var cmd = this.parseCommand(str);
        if (this.commands[cmd] == undefined) {
            return ret;
        }
        var args = this.parseArguments(str);
        ret.isCmd = true;
        ret.command = cmd;
        ret.args = args;
        return ret;
    }

    private parseCommand(str: string) {
        return str.split(' ')[0].replace(this.prefix, '').toLowerCase().trim();
    }

    private parseArguments(str: string) {
        let args = new Array<string>(0);
        let index = str.indexOf(' ');
        if (index == -1) {
            return args;
        }
        str = str.substr(index).trim();
        let flag = false;
        let current = '';
        for (let i = 0; i < str.length; i++) {
            let char = str[i];
            if (char == '"') {
                if (!flag) {
                    flag = true;
                }
                else {
                    let t = current.trim();
                    if (t != null && t.length > 0) {
                        args[args.length] = t;
                    }
                    flag = false;
                    current = ''
                }
            }
            else if (char.match(/\s+/g) && !flag) {
                let t = current.trim();
                if (t != null && t.length > 0) {
                    args[args.length] = t;
                }
                current = '';
            }
            else {
                current += char;
            }
        }
        let t = current.trim();
        if (t != null && t.length > 0) {
            args[args.length] = t;
        }
        current = '';
        return args;
    }
}

class Command {
    callback: (msg: Message, args?: string[]) => void;
    constructor(callback: (msg: Message, args?: string[]) => void) {
        this.callback = callback
    }
}

class ConsoleCommand{
    callback: (args?: string[]) => void;
    constructor(callback: (args?: string[]) => void) {
        this.callback = callback
    }
}