import { Message } from 'discord.js'
import * as fs from 'fs'

const settingsfile = './commands.json'

//#region Types

export enum CommandType { PM, server, shared, console }

interface IServerData {
    prefix: string;
    disabledCommands: Array<string> //inactive
    alertonwrongcommand: boolean
}

export class CommandException {
    notExist: boolean
    nativeType: CommandType | null
    calledType: CommandType
    constructor(ne, nt, ct) {
        this.notExist = ne
        this.nativeType = nt
        this.calledType = ct
    }
}

interface ICommand {
    name: string
    type: CommandType
    callback: (...params) => void
}

class ConsoleCommand implements ICommand {
    name: string
    type = CommandType.console
    callback: ((args: string[]) => void) | (() => void)
    constructor(cmd: string, callback: ((args: string[]) => void) | (() => void)) {
        this.name = cmd;
        this.callback = callback
    }
}

abstract class DiscordCommand implements ICommand {
    name: string
    type: CommandType.server | CommandType.PM | CommandType.shared
    callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)

    constructor(cmd: string, type: CommandType.server | CommandType.PM | CommandType.shared, callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)) {
        this.name = cmd;
        this.type = type;
        this.callback = callback;
    }
}

class SharedCommand extends DiscordCommand implements ICommand {
    constructor(cmd: string, callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)) {
        super(cmd, CommandType.shared, callback);
    }
}

class PMCommand extends DiscordCommand implements ICommand {
    constructor(cmd: string, callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)) {
        super(cmd, CommandType.PM, callback);
    }
}

class ServerCommand extends DiscordCommand implements ICommand {
    constructor(cmd: string, callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)) {
        super(cmd, CommandType.server, callback);
    }
}

//#endregion

export class CommandHandler {
    private serversettings: Array<IServerData>;
    private defaultprefix: string;
    private commands: Array<ICommand>
    constructor(defaultprefix: string = '/') {
        this.defaultprefix = defaultprefix;
        this.serversettings = new Array<IServerData>();
        this.loadServerSettings();
        this.commands = new Array<ICommand>();
    }

    get defaultPrefix() {
        return this.defaultprefix
    }

    private loadServerSettings() {
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

    private saveServerSettings() {
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

    private callConsoleCallback(name: string, args: string[]) {
        let callback = (this.commands[name] as ICommand).callback;
        callback.call(this, args);
    }

    private callDiscordCallback(name: string, message: Message, args: string[]) {
        let callback = (this.commands[name] as ICommand).callback;
        callback.call(this, message, args);
    }

    handleDiscordMessage(msg: Message) {
        var cmd = this.parseDiscordCommand(msg);
        let cmdtype= msg.guild != undefined ? CommandType.server : CommandType.PM
        let ret = this.existsCommand(cmd, cmdtype);
        if (ret == true) {
            var args = this.parseCommandArguments(msg.content);
            this.callDiscordCallback(cmd, msg, args);
        }
        return ret;
    }

    handleConsoleMessage(message: string) {
        var cmd = this.parseConsoleCommand(message);
        let ret = this.existsCommand(cmd, CommandType.console)
        if (ret == true) {
            var args = this.parseCommandArguments(message);
            this.callConsoleCallback(cmd, args);
        }
        return ret;
    }

    private parseDiscordCommand(msg: Message) { //later this will include checks for disabled commands on certain server
        var prefix = this.prefixOnServer(msg.guild.id)
        return msg.content.split(' ')[0].replace(prefix, '').toLowerCase().trim();
    }

    private parseConsoleCommand(msg: string) {
        return msg.split(' ')[0].toLowerCase().trim();
    }

    private parseCommandArguments(msg: string) {
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

    private existsCommand(cmd: string, type: CommandType) {
        var c = (this.commands[cmd] as ICommand);
        if (c == undefined || c == null) {
            return new CommandException(true, null, type)
        }
        if (type == c.type || (c.type == CommandType.shared && type != CommandType.console)) {
            return true;
        }
        else {
            return new CommandException(false, c.type, type);
        }
    }

    alertOnServer(id: string, set?: boolean) {
        if (set == undefined) {
            return (this.serversettings[id] as IServerData).alertonwrongcommand
        }

        (this.serversettings[id] as IServerData).alertonwrongcommand = set;
        this.saveServerSettings();
    }

    prefixOnServer(id: string, prefix?: string) {
        if (prefix != undefined) {
            (this.serversettings[id] as IServerData).prefix = prefix;
            this.saveServerSettings();
            return prefix;
        }
        else if (this.serversettings[id] == undefined) {
            (this.serversettings[id] as IServerData).prefix = this.defaultprefix;
            this.saveServerSettings();
            return this.defaultprefix
        }
        else {
            return (this.serversettings[id] as IServerData).prefix;
        }
    }

    // toggleCommandOnServer(id:string, cmd:string){
    //     if (this.isCommandDisabledOnServer(id,cmd)) {

    //         (this.serversettings[id] as IServerData).disabledCommands[(this.serversettings[id] as IServerData).disabledCommands.findIndex(c => c == cmd)] = ''
    //     }
    // }

    // isCommandDisabledOnServer(id:string, cmd:string){
    //     return (this.serversettings[id] as IServerData).disabledCommands.findIndex(c => c == cmd) != -1;
    // }

}