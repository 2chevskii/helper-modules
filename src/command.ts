import { Message } from 'discord.js'
import * as fs from 'fs'
import Log from './log'

export namespace Command {
    /** Path to the file with saved settings, not intended to be changed, but nothing will probably go wrong if you know, what you are doing */
    const datafile = './commands.json'

    const logger = new Log.LogHandler('command-module')

    //#region Types

    /**
     * Represents the type of command object
     */
    export enum CommandType { DM, server, shared, console }

    /**
     * Objects which implement this interface contain server data saved between sessions
     */
    interface IServerData {
        id:string
        /** Server's current command prefix */
        prefix: string;
        /** Temporarily disabled, as this feature is not implemented yet. Later this will allow to disable certain commands on specific */
        disabledCommands: string[]
    }

    export class CommandResolveResult {
        isCommand: boolean
        message: Message | undefined
        text: string
        cmd: string | undefined
        args: string[] | undefined
        argsCount: number
        wasExecuted: boolean
        calledIn: CommandType | undefined
        nativeIn: CommandType | undefined
        constructor(iscmd: boolean, msg: Message | undefined, cmd: string | undefined, args: string[] | undefined, nativeIn: CommandType, calledIn: CommandType) {
            this.isCommand = iscmd;
            this.message = msg;
            this.cmd = cmd;
            this.args = args;
            this.text = msg != undefined ? msg.content : cmd != undefined ? cmd : ''
            this.argsCount = args != undefined ? args.length : 0
            this.nativeIn = nativeIn;
            this.calledIn = calledIn
            this.wasExecuted = nativeIn == calledIn || (nativeIn == CommandType.shared && (calledIn == CommandType.DM || calledIn == CommandType.server))
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
        type: CommandType.server | CommandType.DM | CommandType.shared
        callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)
        /**
         * Initializes new object of discord command. Cannot be called directly
         * @param {string} cmd Command name
         * @param {CommandType} type Command type. Set automatically by derived types' constructors
         * @param callback Command callback
         */
        constructor(cmd: string, type: CommandType.server | CommandType.DM | CommandType.shared, callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)) {
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
    class DMCommand extends DiscordCommand implements ICommand {
        constructor(cmd: string, callback: ((message: Message, args: string[]) => void) | ((message: Message) => void) | (() => void)) {
            super(cmd, CommandType.DM, callback);
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
            this.commands = new Array<ICommand>();
            this.serversettings = new Array<IServerData>();
            this.loadServerSettings();
        }

        /** Getter for default prefix, as it is not intended to be modified during runtime
         * @returns {string} Default prefix
         */
        get defaultPrefix(): string {
            return this.defaultprefix
        }

        /** Create new, or load existing settings file */
        private loadServerSettings() {
            if (!fs.existsSync(datafile)) {
                this.saveServerSettings();
            }

            try {
                this.serversettings = JSON.parse(fs.readFileSync(datafile, {
                    encoding: 'utf-8',
                    flag: 'r'
                }))
            } catch {
                fs.unlinkSync(datafile);
                this.loadServerSettings();
            }
        }

        /** Save current `serversettings` to the file */
        private saveServerSettings() {
            fs.writeFileSync(datafile, JSON.stringify(this.serversettings, null, '\t'))
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

            if (this.commands.find((c) => c.name == cmd && c.type == type) != undefined) { //command already exist
                return false;
            }

            var command:ICommand = {
                callback: () => {},
                name: '',
                type: CommandType.console
            }

            switch (type) {
                case CommandType.console:
                    command = new ConsoleCommand(cmd, callback)
                    break;

                case CommandType.shared:
                    command = new SharedCommand(cmd, callback)
                    break;

                case CommandType.server:
                    command = new ServerCommand(cmd, callback)
                    break;

                case CommandType.DM:
                    command = new DMCommand(cmd, callback)
                    break;
            }

            this.commands.push(command)

            return true;
        }

        /**
         * Deletes command
         * @param {string} cmd Name of the command
         * @returns {boolean} `true` if the command used to exist and was successfully deleted, `false` if the command does not exist
         */
        unregisterCommand(cmd: string) {
            cmd = cmd.toLowerCase();
            if (this.commands.find((c) => c.name == cmd) == undefined) {
                return false;
            }
            delete this.commands[this.commands.findIndex(c => c.name == cmd)]
        }

        /** Fires callback with given arguments for console command */
        private callConsoleCallback(command: ConsoleCommand, args: string[]) {
            command.callback.call(this, args);
        }

        /** Fires callback with given arguments for discord command */
        private callDiscordCallback(command: DiscordCommand, message: Message, args: string[]) {
            command.callback.call(this, message, args);
        }

        /**
         * Add this to your `Discord.Client.on('message')` event handler
         * @param {Message} msg Message which was sent by user
         * @returns {boolean} `true` if the command was successfully executed, `false` if the command was not executed (does not exist, wrong channel type, etc.)
         */
        handleDiscordMessage(msg: Message) {
            
        }

        /**
         * Add this to your 'console' event handler.
         * @param {string} message Message which was received by console prompt
         * @returns {boolean} `true` if the command was successfully executed, `false` if the command does not exist
         */
        handleConsoleMessage(message: string) {
            
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
         * Returns an array of parsed arguments.
         * @param {string} msg Message object
         * @returns {string[]} Array of parsed arguments. *Cannot be null, but can be 0 length*
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

        getPrefix(id: string){

        }

        setPrefix(id: string, prefix: string){
            
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
}

export default Command