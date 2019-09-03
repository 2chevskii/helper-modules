import { Message, VoiceBroadcast } from 'discord.js'
import * as fs from 'fs'
import * as timers from 'timers'

const settingsfile = './commands.json'

interface ServerData {
    prefix: string;
    disabledCommands: Array<string> //inactive
    alertonwrongcommand: boolean
}

class CommandHandler {
    private serversettings: Array<ServerData>;
    private defaultprefix: string;
    private commands: Array<Command>
    constructor(defaultprefix: string = '/') {
        this.defaultprefix = defaultprefix;
        this.serversettings = new Array<ServerData>();
        this.loadServerSettings();
        this.commands = new Array<Command>();
    }

    get defaultPrefix() {
        return this.defaultprefix
    }

    loadServerSettings() {
        if (!fs.existsSync(settingsfile)) {
            this.saveServerSettings();
        }

        try {
            this.serversettings = JSON.parse(fs.readFileSync(settingsfile, {
                encoding: 'utf-8',
                flag: 'r'
            }))
        } catch {
            fs.unlinkSync(settingsfile);
            this.loadServerSettings();
        }
    }

    saveServerSettings() {
        fs.writeFileSync(settingsfile, JSON.stringify(this.serversettings, null, '\t'))
    }



    registerCommand(cmd: string, type: CommandType, callback: (...args) => void) {
        cmd = cmd.toLowerCase();
        if (cmd.includes('"') || cmd.includes("'") || cmd.includes('/') || cmd.includes(' ') || cmd.includes('\\')) { //command name cannot include special symbols such as ' " / \ \s
            return false;
        }

        if (this.commands[cmd] != undefined) {
            return false;
        }

        switch (type) {
            case CommandType.console:
                this.commands[cmd] = new ConsoleCommand(cmd, callback)
                break;

            case CommandType.shared:
                this.commands[cmd] = new SharedCommand(cmd, callback)
                break;

            case CommandType.server:
                this.commands[cmd] = new ServerCommand(cmd, callback)
                break;

            case CommandType.PM:
                this.commands[cmd] = new PMCommand(cmd, callback)
                break;
        }

        return true;
    }

    unregisterCommand(cmd: string) {
        cmd = cmd.toLowerCase();
        if (this.commands[cmd] == undefined) {
            return false;
        }
        this.commands[cmd] = undefined;
    }

    callConsoleCallback(name: string, args: string[]) {
        let callback = (this.commands[name] as Command).callback;
        callback.call(this, args);
    }

    callDiscordCallback(name: string, message: Message, args: string[]) {
        let callback = (this.commands[name] as Command).callback;
        callback.call(this, message, args);
    }



    handleDiscordMessage(msg: Message) {
        var cmd = this.parseDiscordCommand(msg);
        if (!this.existsCommand(cmd, CommandType.)) { //rethink life (existsCommand method)
            
        }
    }

    handleConsoleMessage(message: string) {
        var cmd = this.parseConsoleCommand(message);
        if (!this.existsCommand(cmd, CommandType.console)) {
            return false;
        }
        var args = this.parseCommandArguments(message);
        this.callConsoleCallback(cmd, args);
    }

    parseDiscordCommand(msg: Message) { //later this will include checks for disabled commands on certain server
        var prefix = this.prefixOnServer(msg.guild.id)
        return msg.content.split(' ')[0].replace(prefix, '').toLowerCase().trim();
    }

    parseConsoleCommand(msg: string) {
        return msg.split(' ')[0].toLowerCase().trim();
    }

    parseCommandArguments(msg: string) {
        var args = new Array<string>(0);
        let index = msg.indexOf(' ')
        msg = msg.substr(index).trim();

        if (index == -1 || msg.length < 1) {
            return args;
        }

        let flag = false;
        let current = ''
        for (let i = 0; i < msg.length; i++) {
            let char = msg[i];
            if (char == '"') {
                if (!flag) {
                    flag = true;
                }
                else {
                    let t = current.trim();
                    if (t != null && t.length > 0) {
                        args.push(t);
                    }
                    flag = false;
                    current = ''
                }
            }
            else if (char.match(/\s+/g) && !flag) {
                let t = current.trim();
                if (t != null && t.length > 0) {
                    args.push(t);
                }
                flag = false;
                current = ''
            }
            else {
                current += char;
            }
        }
        let t = current.trim();
        if (t != null && t.length > 0) {
            args.push(t);
        }
        flag = false;
        current = ''
        return args;
    }

    existsCommand(cmd: string, type: CommandType) {
        var c = (this.commands[cmd] as Command);
        return c != undefined && c != null && (c.type == type || (c.type == CommandType.shared && (type == CommandType.server || type == CommandType.PM)))
    }

    alertOnServer(id: string, set?: boolean) {
        if (set == undefined) {
            return (this.serversettings[id] as ServerData).alertonwrongcommand
        }

        (this.serversettings[id] as ServerData).alertonwrongcommand = set;
        this.saveServerSettings();
    }

    prefixOnServer(id: string, prefix?: string) {
        if (prefix != undefined) {
            (this.serversettings[id] as ServerData).prefix = prefix;
            this.saveServerSettings();
            return prefix;
        }
        else if (this.serversettings[id] == undefined) {
            (this.serversettings[id] as ServerData).prefix = this.defaultprefix;
            this.saveServerSettings();
            return this.defaultprefix
        }
        else {
            return (this.serversettings[id] as ServerData).prefix;
        }
    }

    // toggleCommandOnServer(id:string, cmd:string){
    //     if (this.isCommandDisabledOnServer(id,cmd)) {

    //         (this.serversettings[id] as ServerData).disabledCommands[(this.serversettings[id] as ServerData).disabledCommands.findIndex(c => c == cmd)] = ''
    //     }
    // }

    // isCommandDisabledOnServer(id:string, cmd:string){
    //     return (this.serversettings[id] as ServerData).disabledCommands.findIndex(c => c == cmd) != -1;
    // }

}

//#region Types

enum CommandType { PM, server, shared, console }

interface Command {
    name: string
    type: CommandType
    callback: (...params) => void
}

class ConsoleCommand implements Command {
    name: string
    type = CommandType.console
    callback: ((args: string[]) => void) | (() => void)
    constructor(cmd: string, callback: ((args: string[]) => void) | (() => void)) {
        this.name = cmd;
        this.callback = callback
    }
}

abstract class DiscordCommand implements Command {
    name: string
    type: CommandType.server | CommandType.PM | CommandType.shared
    callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)

    constructor(cmd: string, type: CommandType.server | CommandType.PM | CommandType.shared, callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)) {
        this.name = cmd;
        this.type = type;
        this.callback = callback;
    }
}

class SharedCommand extends DiscordCommand implements Command {
    constructor(cmd: string, callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)) {
        super(cmd, CommandType.shared, callback);
    }
}

class PMCommand extends DiscordCommand implements Command {
    constructor(cmd: string, callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)) {
        super(cmd, CommandType.PM, callback);
    }
}

class ServerCommand extends DiscordCommand implements Command {
    constructor(cmd: string, callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)) {
        super(cmd, CommandType.server, callback);
    }
}

//#endregion

export class chndl {


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

class cCommand {
    callback: (msg: Message, args?: string[]) => void;
    constructor(callback: (msg: Message, args?: string[]) => void) {
        this.callback = callback
    }
}

class cConsoleCommand {
    callback: (args?: string[]) => void;
    constructor(callback: (args?: string[]) => void) {
        this.callback = callback
    }
}

export default { chndl }