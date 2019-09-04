import { Message } from 'discord.js'
import * as fs from 'fs'

/** Path to the file with saved settings, not intended to be changed, but nothing will probably go wrong if you know, what you are doing */
const settingsfile = './commands.json'

//#region Types

/**
 * Represents the type of command object
 */
export enum CommandType { PM, server, shared, console }

/**
 * Objects which implement this interface contain server data saved between sessions
 */
interface IServerData {
    /** Server's current command prefix */
    prefix: string;
    /** Temporarily disabled, as this feature is not implemented yet. Later this will allow to disable certain commands on specific */
    //disabledCommands: Array<string>
    /** Not shipped with any alert methods (yet), but you can natively check this in your code to fire some function */
    alertonwrongcommand: boolean
}

/**
 * Represents unsuccessfull command call
 */
export class CommandException {
    /** 'true' if the command with given name does not exist */
    notExist: boolean
    /** 'null' if the command does not exist, otherwise - specifies the type of the existing command */
    nativeType: CommandType | null
    /** Specifies the type expected from command */
    calledType: CommandType
    /**
     * Initializes new CommandException object
     * @param {boolean} notExist 'notExist' setter
     * @param {CommandType | null} nativeType 'nativeType' setter
     * @param {CommandType} calledType 'calledType' setter
     */
    constructor(notExist: boolean, nativeType: CommandType | null, calledType: CommandType) {
        this.notExist = notExist
        this.nativeType = nativeType
        this.calledType = calledType
    }
}

/**
 * Abstraction on all command types
 */
interface ICommand {
    /** Command name, *does not* include prefix */
    name: string
    /** Command type: PM | server | shared | console */
    type: CommandType
    /** Function that can be fired on command execution. *Be aware:* arguments may vary depending on command type */
    callback: (...params) => void
}

/**
 * Command which can only be executed inside of Node.js console, or every other input prompt which *does not* require prefix
 */
class ConsoleCommand implements ICommand {
    name: string
    type = CommandType.console
    callback: ((args: string[]) => void) | (() => void)
    /**
     * Initializes new object of console command
     * @param {string} cmd Command name
     * @param callback Command callback
     */
    constructor(cmd: string, callback: ((args: string[]) => void) | (() => void)) {
        this.name = cmd;
        this.callback = callback
    }
}

/**
 * Abstraction on Discord commands
 */
abstract class DiscordCommand implements ICommand {
    name: string
    type: CommandType.server | CommandType.PM | CommandType.shared
    callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)
    /**
     * Initializes new object of discord command. Cannot be called directly
     * @param {string} cmd Command name
     * @param {CommandType} type Command type. Set automatically by derived types' constructors
     * @param callback Command callback
     */
    constructor(cmd: string, type: CommandType.server | CommandType.PM | CommandType.shared, callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)) {
        this.name = cmd;
        this.type = type;
        this.callback = callback;
    }
}

/**
 * Command which can be executed both on Discord server and in PM
 */
class SharedCommand extends DiscordCommand implements ICommand {
    constructor(cmd: string, callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)) {
        super(cmd, CommandType.shared, callback);
    }
}

/**
 * Command which can only be executed in Discord PM. *Does not require prefix*
 */
class PMCommand extends DiscordCommand implements ICommand {
    constructor(cmd: string, callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)) {
        super(cmd, CommandType.PM, callback);
    }
}

/**
 * Command which can only be executed on Discord server
 */
class ServerCommand extends DiscordCommand implements ICommand {
    constructor(cmd: string, callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)) {
        super(cmd, CommandType.server, callback);
    }
}

//#endregion

/**
 * General export class. Create an instance of this if you want to use this module functionality
 */
export class CommandHandler {
    /** Saves server preferences such as `prefix` */
    private serversettings: Array<IServerData>;
    /** Default prefix for all the new servers */
    private defaultprefix: string;
    /** Contains all of the registered commands */
    private commands: Array<ICommand>
    /**
     * Initializes new instance of CommandHandler object. `defaultPrefix` can be omitted
     * @param {string | undefined} defaultprefix Sets default value for prefix on servers. If omitted, it will be `/`
     */
    constructor(defaultprefix: string = '/') {
        this.defaultprefix = defaultprefix;
        this.serversettings = new Array<IServerData>();
        this.loadServerSettings();
        this.commands = new Array<ICommand>();
    }

    /** Getter for default prefix, as it is not intended to be modified during runtime
     * @returns {string} Default prefix
     */
    get defaultPrefix() {
        return this.defaultprefix
    }

    /** Create new, or load existing settings file */
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

    /** Save current `serversettings` to the file */
    private saveServerSettings() {
        fs.writeFileSync(settingsfile, JSON.stringify(this.serversettings, null, '\t'))
    }

    /**
     * Register new command. Needs to be fired *every* time you load your app, since commands are not saved anywhere
     * @param {string} cmd Name of the command. *Case-independent*. Cannot contain special symbols such as:
     * - `space`
     * - `forwardslash`
     * - `backslash`
     * - `quotes` (single or double)
     * @param {CommandType} type Type of the command. `CommandType.server` will probably be the choice in most situations
     * @param {(...args) => void} callback Command callback, depends on the type of command. Can contain equal or less amount of arguments: 
     * - For console commands -> `(string[]) => void`
     * - For discord commands -> `(Discord.Message, string[]) => void`
     * @returns `true` if the command was registered successfully, `false` if the command contains blacklisted symbols or already exists
     */
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

    /**
     * Deletes command
     * @param {string} cmd Name of the command
     * @returns {boolean} `true` if the command used to exist and was successfully deleted, `false` if the command does not exist
     */
    unregisterCommand(cmd: string) {
        cmd = cmd.toLowerCase();
        if (this.commands[cmd] == undefined) {
            return false;
        }
        this.commands[cmd] = undefined;
    }

    /** Fires callback with given arguments for console command */
    private callConsoleCallback(name: string, args: string[]) {
        let callback = (this.commands[name] as ICommand).callback;
        callback.call(this, args);
    }

    /** Fires callback with given arguments for discord command */
    private callDiscordCallback(name: string, message: Message, args: string[]) {
        let callback = (this.commands[name] as ICommand).callback;
        callback.call(this, message, args);
    }

    /**
     * Add this to your `Discord.Client.on('message')` event handler
     * @param {Message} msg Message which was sent by user
     * @returns {boolean} `true` if the command was successfully executed, `false` if the command was not executed (does not exist, wrong channel type, etc.)
     */
    handleDiscordMessage(msg: Message) {
        let cmdtype = msg.guild != undefined ? CommandType.server : CommandType.PM
        if (cmdtype == CommandType.server) {
            var cmd = this.parseDiscordCommand(msg);
        }
        else {
            var cmd = this.parsePMCommand(msg);
        }
        let ret = this.existsCommand(cmd, cmdtype);
        if (ret == true) {
            var args = this.parseCommandArguments(msg.content);
            this.callDiscordCallback(cmd, msg, args);
        }
        return ret;
    }

    /**
     * Add this to your 'console' event handler.
     * @param {string} message Message which was received by console prompt
     * @returns {boolean} `true` if the command was successfully executed, `false` if the command does not exist
     */
    handleConsoleMessage(message: string) {
        var cmd = this.parseConsoleCommand(message);
        let ret = this.existsCommand(cmd, CommandType.console)
        if (ret == true) {
            var args = this.parseCommandArguments(message);
            this.callConsoleCallback(cmd, args);
        }
        return ret;
    }

    /**
     * Attempts parsing of the command name from the message
     * @param msg Message object
     * @returns {string} Parsed command
     */
    private parsePMCommand(msg: Message) {
        return msg.content.split(' ')[0].toLowerCase().trim()
    }

    /**
     * Attempts parsing of the command name from the message
     * @param msg Message object
     * @returns {string} Parsed command
     */
    private parseDiscordCommand(msg: Message) { //later this will include checks for disabled commands on certain server
        var prefix = this.prefixOnServer(msg.guild.id)
        return msg.content.split(' ')[0].replace(prefix, '').toLowerCase().trim();
    }

    /**
     * Attempts parsing of the command name from the message
     * @param {string} msg Message object
     * @returns {string} Parsed command
     */
    private parseConsoleCommand(msg: string) {
        return msg.split(' ')[0].toLowerCase().trim();
    }

    /**
     * Returns an array of parsed arguments. *Cannot be null, but can be 0 length*
     * @param {string} msg Message object
     * @returns {string[]} Array of parsed arguments
     */
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

    /**
     * Checks if the command exists under the given conditions
     * @param {string} cmd Command name
     * @param {CommandType} type Command type
     * @returns {boolean | CommandException} Success or generated exception
     */
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

    /**
     * Returns state of the `alertonwrongcommand` property for given server id, or sets it
     * @param {string} id Serverid
     * @param {boolean} set Sets new state for that property, can be omitted to get current value
     * @returns {boolean | undefined} Value of `IServerData.alertonwrongcommand` if `set` argument is omitted, otherwise sets this property
     */
    alertOnServer(id: string, set?: boolean) {
        if (set == undefined) {
            return (this.serversettings[id] as IServerData).alertonwrongcommand
        }

        (this.serversettings[id] as IServerData).alertonwrongcommand = set;
        this.saveServerSettings();
    }

    /**
     * Returns current prefix for given serverid, or sets it. If the server is not recorded in data yet, it also creates default profile for the server
     * @param {string} id Serverid
     * @param {string | undefined} prefix Sets new prefix for specified server, can be omitted to get current prefix
     * @returns {string} Prefix
     */
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

    // Features on-the-way

    //isCommandAttempt(msg: Message)

    // toggleCommandOnServer(id:string, cmd:string){
    //     if (this.isCommandDisabledOnServer(id,cmd)) {

    //         (this.serversettings[id] as IServerData).disabledCommands[(this.serversettings[id] as IServerData).disabledCommands.findIndex(c => c == cmd)] = ''
    //     }
    // }

    // isCommandDisabledOnServer(id:string, cmd:string){
    //     return (this.serversettings[id] as IServerData).disabledCommands.findIndex(c => c == cmd) != -1;
    // }

}