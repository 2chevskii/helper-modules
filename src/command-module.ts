import { Message } from 'discord.js'
import * as path from 'path'
import * as fs from 'fs'
import { Log } from './log-module'

/**
 * Contains definitions for handling commands.
 * @namespace Command
 */
export namespace Command {

    const commanddatafile = `.${path.sep}helper-modules${path.sep}command-module.json`

    const defaultprefix = '!'

    type CommandResolveResult<T extends string | Message> = Command.Utility.CommandResolveResult<T>

    /**
     * Universal method for command handling.
     *
     * @export
     * @param {Message} message
     * @param {boolean} [executeCallback]
     * @returns {Promise<CommandResolveResult<Message>>}
     * @memberof Command
     */
    export async function onMessage(message: Message, executeCallback?: boolean): Promise<CommandResolveResult<Message>>
    export async function onMessage(message: string, executeCallback?: boolean): Promise<CommandResolveResult<string>>
    export async function onMessage(message: string | Message, executeCallback: boolean = true): Promise<CommandResolveResult<string> | CommandResolveResult<Message>> {
        if (typeof message === 'string') {
            return onConsoleMessage(message, executeCallback)
        }
        else {
            return onDiscordMessage(message, executeCallback)
        }
    }

    /**
     * Method for handling console commands.
     *
     * @export
     * @param {string} message
     * @param {boolean} [executeCallback=true]
     * @returns {Promise<CommandResolveResult<string>>}
     * @memberof Command
     */
    export async function onConsoleMessage(message: string, executeCallback: boolean = true): Promise<CommandResolveResult<string>> {
        return CommandInternal.Instance.onConsoleMessage(message, executeCallback)
    }

    /**
     * Method for hadnling discord commands and messages.
     *
     * @export
     * @param {Message} message
     * @param {boolean} [executeCallback=true]
     * @returns {Promise<CommandResolveResult<Message>>}
     * @memberof Command
     */
    export function onDiscordMessage(message: Message, executeCallback: boolean = true): Promise<CommandResolveResult<Message>> {
        return CommandInternal.Instance.onDiscordMessage(message, executeCallback)
    }

    /**
     * Get all existing commands.
     *
     * @export
     * @returns {{ name: string, type: Command.Utility.CommandType }[]}
     * @memberof Command
     */
    export function getCommands(): { name: string, type: Command.Utility.CommandType }[] {
        return CommandInternal.Instance.getCommands()
    }

    /**
     * Get callback(s) for specifies command name.
     *
     * @export
     * @param {string} cmd
     * @returns {(ICommand['callback'] | { type: Command.Utility.CommandType, callback: ICommand['callback'] }[] | undefined)}
     * @memberof Command
     */
    export function getCallback(cmd: string): ICommand['callback'] | { type: Command.Utility.CommandType, callback: ICommand['callback'] }[] | undefined {
        return CommandInternal.Instance.getCallback(cmd)
    }

    /**
     * Register new command.
     *
     * @export
     * @param {string} cmd
     * @param {(Command.Utility.CommandType.DM | Command.Utility.CommandType.server | Command.Utility.CommandType.shared)} type
     * @param {DiscordCommand['callback']} callback
     * @returns {boolean}
     * @memberof Command
     */
    export function registerCommand(cmd: string, type: Command.Utility.CommandType.DM | Command.Utility.CommandType.server | Command.Utility.CommandType.shared, callback: DiscordCommand['callback']): boolean
    export function registerCommand(cmd: string, type: Command.Utility.CommandType.console, callback: ConsoleCommand['callback']): boolean
    export function registerCommand(cmd: string, type: Command.Utility.CommandType, callback: ICommand['callback']): boolean {
        return CommandInternal.Instance.registerCommand(cmd, type, callback)
    }

    /**
     * Remove command from data.
     *
     * @export
     * @param {string} cmd
     * @returns {boolean}
     * @memberof Command
     */
    export function unregisterCommand(cmd: string): boolean {
        return CommandInternal.Instance.unregisterCommand(cmd)
    }

    /**
     * Disable command for specified id.
     *
     * @export
     * @param {string} id
     * @param {string} cmd
     * @returns {boolean}
     * @memberof Command
     */
    export function disableCommand(id: string, cmd: string): boolean {
        return CommandInternal.Instance.disableCommand(id, cmd)
    }

    /**
     * Enable previously disabled command.
     *
     * @export
     * @param {string} id
     * @param {string} cmd
     * @returns {boolean}
     * @memberof Command
     */
    export function enableCommand(id: string, cmd: string): boolean {
        return CommandInternal.Instance.enableCommand(id, cmd)
    }

    /**
     * Get all disabled commands for specified user/server id.
     *
     * @export
     * @param {string} id
     * @returns {string[]}
     * @memberof Command
     */
    export function getDisabledCommands(id: string): string[] {
        return CommandInternal.Instance.getDisabledCommands(id)
    }

    /**
     * Get state of command for chosen id.
     *
     * @export
     * @param {string} id
     * @param {string} name
     * @returns {boolean}
     * @memberof Command
     */
    export function isCommandDisabled(id: string, name: string): boolean {
        return CommandInternal.Instance.isCommandDisabled(id, name)
    }

    /**
     * Internal type which hides certain methods from public usage.
     *
     * @class CommandInternal
     * @memberof Command
     */
    class CommandInternal {

        /**
         * @private
         * @static
         * @type {CommandInternal}
         * @memberof Command.CommandInternal
         */
        private static _instance: CommandInternal

        /**
         * @private
         * @type {Data[]}
         * @memberof Command.CommandInternal
         */
        private data: Data[]

        /**
         * @private
         * @type {ICommand[]}
         * @memberof Command.CommandInternal
         */
        private commands: ICommand[]

        /**
         * Creates an instance of CommandInternal.
         * @memberof Command.CommandInternal
         */
        public constructor() {
            this.data = new Array<Data>()
            this.commands = new Array<ICommand>()
            this.loadData()
        }

        /**
         * @param {Message} message
         * @param {boolean} execute
         * @returns {Promise<Command.Utility.CommandResolveResult<Message>>}
         * @memberof Command.CommandInternal
         */
        public async onDiscordMessage(message: Message, execute: boolean): Promise<Command.Utility.CommandResolveResult<Message>> {
            return new Promise(resolve => {
                var cmd = this.parseCommand(message)
                var ct = message.guild == undefined ? Command.Utility.CommandType.DM : Command.Utility.CommandType.server
                if (cmd === undefined) {
                    resolve(new Command.Utility.CommandResolveResult(false, message, ct, false))
                }
                else {
                    var args = this.parseArguments(message.content)

                    var commands = this.findCommands(cmd)

                    if (commands === undefined) {
                        resolve(new Command.Utility.CommandResolveResult(true, message, ct, false, cmd, args))
                    }
                    else {
                        var exactCommand = this.findCommands(cmd, ct) as DiscordCommand
                        if (exactCommand == undefined) {
                            resolve(new Command.Utility.CommandResolveResult(true, message, ct, false, cmd, args, commands[0].type, commands[0].callback))
                        }
                        else if (execute) {
                            exactCommand.executeCallback(message, args)
                                .then(val => resolve(new Command.Utility.CommandResolveResult(true, message, ct, true, cmd, args, exactCommand!.type, exactCommand!.callback, val)))
                                .catch(ex => resolve(new Command.Utility.CommandResolveResult(true, message, ct, true, cmd, args, exactCommand!.type, exactCommand!.callback, ex)))
                        }
                        else {
                            resolve(new Command.Utility.CommandResolveResult(true, message, ct, false, cmd, args, exactCommand.type, exactCommand.callback))
                        }
                    }
                }
            })
        }

        /**
         * @param {string} message
         * @param {boolean} execute
         * @returns {Promise<Command.Utility.CommandResolveResult<string>>}
         * @memberof Command.CommandInternal
         */
        public async onConsoleMessage(message: string, execute: boolean): Promise<Command.Utility.CommandResolveResult<string>> {
            return new Promise((resolve) => {
                var cmd = this.parseCommand(message)
                if (cmd === undefined) {
                    resolve(new Command.Utility.CommandResolveResult(false, message, Command.Utility.CommandType.console, false))
                }
                else {

                    var args = this.parseArguments(message)

                    var commands = this.findCommands(cmd)

                    if (commands === undefined) {
                        resolve(new Command.Utility.CommandResolveResult(true, message, Command.Utility.CommandType.console, false, cmd, args))
                    }
                    else {
                        var exactCommand = this.findCommands(cmd, Command.Utility.CommandType.console)
                        if (exactCommand === undefined) {
                            resolve(new Command.Utility.CommandResolveResult(true, message, Command.Utility.CommandType.console, false, cmd, args, commands[0].type, commands[0].callback))
                        }
                        else if (execute) {
                            exactCommand.executeCallback(args)
                                .then(val => resolve(new Command.Utility.CommandResolveResult(true, message, Command.Utility.CommandType.console, true, cmd, args, exactCommand!.type, exactCommand!.callback, val)))
                                .catch(ex => resolve(new Command.Utility.CommandResolveResult(true, message, Command.Utility.CommandType.console, true, cmd, args, Command.Utility.CommandType.console, exactCommand!.callback, ex)))
                        }
                        else {
                            resolve(new Command.Utility.CommandResolveResult(true, message, Command.Utility.CommandType.console, false, cmd, args, exactCommand.type, exactCommand.callback))
                        }
                    }
                }
            })
        }

        /**
         * @private
         * @param {(string | Message)} command
         * @returns {(string | undefined)}
         * @memberof Command.CommandInternal
         */
        private parseCommand(command: string | Message): string | undefined {
            if (typeof command === 'string') {
                let cmd = command.split(' ')[0].trim().toLowerCase()
                if (cmd.length < 1) {
                    return undefined
                }
                return cmd
            }
            else {
                let prefix = command.guild == undefined ? this.getPrefix(command.author.id) : this.getPrefix(command.guild.id)
                let array = command.content.split(' ')
                if (array.length < 1) {
                    return undefined;
                }
                let cmd = array[0]

                if (!cmd.startsWith(prefix)) {
                    return undefined;
                }

                cmd = cmd.replace(prefix, '').trim().toLowerCase()
                if (cmd.length < 1) {
                    return undefined
                }
                return cmd
            }
        }

        /**
         * @private
         * @param {string} msg
         * @returns
         * @memberof Command.CommandInternal
         */
        private parseArguments(msg: string) {
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
         * @param {string} id
         * @returns
         * @memberof Command.CommandInternal
         */
        public getPrefix(id: string) {
            return this.getData(id).getPrefix()
        }

        /**
         * @param {string} id
         * @param {string} prefix
         * @returns {boolean}
         * @memberof Command.CommandInternal
         */
        public setPrefix(id: string, prefix: string): boolean {
            let res = this.getData(id).setPrefix(prefix);
            if (res) {
                fs.mkdirSync(path.dirname(commanddatafile), { recursive: true })
                fs.writeFileSync(commanddatafile, JSON.stringify(this.data))
            }
            return res
        }

        /**
         * @param {string} id
         * @param {string} name
         * @returns {boolean}
         * @memberof Command.CommandInternal
         */
        public isCommandDisabled(id: string, name: string): boolean {
            return this.getData(id).isCommandDisabled(name)
        }

        /**
         * @param {string} id
         * @returns {string[]}
         * @memberof Command.CommandInternal
         */
        public getDisabledCommands(id: string): string[] {
            return this.getData(id).getDisabledCommands()
        }

        /**
         *
         *
         * @param {string} id
         * @param {string} name
         * @returns {boolean}
         * @memberof Command.CommandInternal
         */
        public enableCommand(id: string, name: string): boolean {
            return this.getData(id).enableCommand(name)
        }

        /**
         *
         *
         * @param {string} id
         * @param {string} name
         * @returns {boolean}
         * @memberof Command.CommandInternal
         */
        public disableCommand(id: string, name: string): boolean {
            return this.getData(id).disableCommand(name)
        }

        /**
         *
         *
         * @private
         * @param {string} id
         * @returns {Data}
         * @memberof Command.CommandInternal
         */
        private getData(id: string): Data {
            var data = this.data.find(d => d.id === id)
            if (data === undefined) {
                data = new Data(id)
                this.data.push(data)
                fs.writeFileSync(commanddatafile, JSON.stringify(this.data))
            }
            return data;
        }

        /**
         *
         *
         * @returns {{ name: string, type: Command.Utility.CommandType }[]}
         * @memberof Command.CommandInternal
         */
        public getCommands(): { name: string, type: Command.Utility.CommandType }[] {
            return this.commands.map(cmd => {
                return {
                    name: cmd.name,
                    type: cmd.type
                }
            })
        }

        /**
         *
         *
         * @param {string} name
         * @returns {(undefined | ICommand['callback'] | { type: Command.Utility.CommandType, callback: ICommand['callback'] }[])}
         * @memberof Command.CommandInternal
         */
        public getCallback(name: string): undefined | ICommand['callback'] | { type: Command.Utility.CommandType, callback: ICommand['callback'] }[]
        /**
         *
         *
         * @param {string} name
         * @param {(Command.Utility.CommandType.DM | Command.Utility.CommandType.server | Command.Utility.CommandType.shared)} type
         * @returns {(undefined | typeof DiscordCommand.prototype.callback)}
         * @memberof Command.CommandInternal
         */
        public getCallback(name: string, type: Command.Utility.CommandType.DM | Command.Utility.CommandType.server | Command.Utility.CommandType.shared): undefined | typeof DiscordCommand.prototype.callback
        /**
         *
         *
         * @param {string} name
         * @param {Command.Utility.CommandType.console} type
         * @returns {(undefined | typeof ConsoleCommand.prototype.callback)}
         * @memberof Command.CommandInternal
         */
        public getCallback(name: string, type: Command.Utility.CommandType.console): undefined | typeof ConsoleCommand.prototype.callback
        /**
         *
         *
         * @param {string} name
         * @param {Command.Utility.CommandType} [type]
         * @returns {(undefined | ICommand['callback'] | { type: Command.Utility.CommandType, callback: ICommand['callback'] }[])}
         * @memberof Command.CommandInternal
         */
        public getCallback(name: string, type?: Command.Utility.CommandType): undefined | ICommand['callback'] | { type: Command.Utility.CommandType, callback: ICommand['callback'] }[] {
            var commands: CommandAbstract | CommandAbstract[] | undefined

            if (type === undefined) {
                commands = this.findCommands(name)
            }
            else {
                commands = this.findCommands(name, type)
            }

            if (commands === undefined) {
                return commands
            }

            if (commands instanceof CommandAbstract) {
                return commands.callback
            }
            else {
                return commands.map(cmd => {
                    return {
                        type: cmd.type,
                        callback: cmd.callback
                    }
                })
            }
        }

        /**
         *
         *
         * @param {string} name
         * @returns {(CommandAbstract[] | undefined)}
         * @memberof Command.CommandInternal
         */
        public findCommands(name: string): CommandAbstract[] | undefined
        public findCommands(name: string, type: Command.Utility.CommandType.server): ServerCommand | undefined
        public findCommands(name: string, type: Command.Utility.CommandType.shared): SharedCommand | undefined
        public findCommands(name: string, type: Command.Utility.CommandType.DM): DMCommand | undefined
        public findCommands(name: string, type: Command.Utility.CommandType.console): ConsoleCommand | undefined
        public findCommands(name: string, type: Command.Utility.CommandType): CommandAbstract | CommandAbstract[] | undefined
        public findCommands(name: string, type?: Command.Utility.CommandType): CommandAbstract | CommandAbstract[] | undefined {
            name = name.toLowerCase()
            var nameMatchingCommands = this.commands.filter(cmd => cmd.name == name)
            if (nameMatchingCommands.length < 1) {
                return undefined
            }
            else if (nameMatchingCommands.length == 1) {
                return nameMatchingCommands[0]
            }
            else if (type === undefined) {
                return nameMatchingCommands
            }

            var exactCommand = nameMatchingCommands.find(cmd => cmd.type === type)
            return exactCommand
        }

        /**
         *
         *
         * @param {string} name
         * @param {(Command.Utility.CommandType.shared | Command.Utility.CommandType.server | Command.Utility.CommandType.DM)} type
         * @param {((() => any) | ((message: Message) => any) | ((message: Message, args: string[]) => any))} callback
         * @returns {boolean}
         * @memberof Command.CommandInternal
         */
        public registerCommand(name: string, type: Command.Utility.CommandType.shared | Command.Utility.CommandType.server | Command.Utility.CommandType.DM, callback: (() => any) | ((message: Message) => any) | ((message: Message, args: string[]) => any)): boolean
        public registerCommand(name: string, type: Command.Utility.CommandType.console, callback: (() => any) | ((args: string[]) => any)): boolean
        public registerCommand(name: string, type: Command.Utility.CommandType, callback: (...args: any[]) => any): boolean
        public registerCommand(name: string, type: Command.Utility.CommandType, callback: (...args: any[]) => any): boolean {
            if (name.includes(' ')) {
                return false;
            }

            name = name.toLowerCase()

            var _command = this.findCommands(name, type)

            if (_command !== undefined) {
                return false;
            }

            var commands = this.findCommands(name)

            if (commands !== undefined && type === Command.Utility.CommandType.shared && commands.find(cmd => cmd instanceof DiscordCommand) !== undefined) {
                this.commands = this.commands.filter(cmd => !(cmd.name === name && cmd instanceof DiscordCommand))
            }

            var command: CommandAbstract

            switch (type) {
                case Command.Utility.CommandType.console:
                    command = new ConsoleCommand(name, callback)
                    break;

                case Command.Utility.CommandType.DM:
                    command = new DMCommand(name, callback)
                    break;

                case Command.Utility.CommandType.server:
                    command = new ServerCommand(name, callback)
                    break;

                case Command.Utility.CommandType.shared:
                    command = new SharedCommand(name, callback)
                    break;
            }

            //@ts-ignore
            this.commands.push(command)
            return true
        }

        /**
         *
         *
         * @param {string} cmd
         * @returns {boolean}
         * @memberof Command.CommandInternal
         */
        public unregisterCommand(cmd: string): boolean {
            if (this.commands.find((command) => command.name === cmd) === undefined) {
                return false;
            }
            this.commands = this.commands.filter(command => command.name !== cmd)
            return true
        }

        /**
         *
         *
         * @private
         * @memberof Command.CommandInternal
         */
        private loadData(): void {
            if (!fs.existsSync(commanddatafile)) {
                fs.mkdirSync(path.dirname(commanddatafile), { recursive: true })
                fs.writeFileSync(commanddatafile, JSON.stringify(this.data))
            }
            try {
                this.data = JSON.parse(fs.readFileSync(commanddatafile, { encoding: 'utf-8', flag: 'r' }))
                if (this.data == undefined) {
                    throw 'Data was not loaded correctly, it will be reset'
                }
            } catch (ex) {
                Log.logError(ex)
                fs.unlinkSync(commanddatafile)
                this.loadData()
            }
        }

        /**
         *
         *
         * @readonly
         * @static
         * @type {CommandInternal}
         * @memberof Command.CommandInternal
         */
        public static get Instance(): CommandInternal {
            if (CommandInternal._instance === undefined) {
                CommandInternal._instance = new CommandInternal()
            }
            return CommandInternal._instance
        }
    }

    /**
     *
     *
     * @class Data
     * @memberof Command
     */
    class Data {
        readonly id: string
        private prefix: string
        private disabledCommands: string[]

        public constructor(id: string) {
            this.id = id
            this.prefix = defaultprefix
            this.disabledCommands = new Array<string>()
        }

        public disableCommand(cmd: string): boolean {
            if (this.isCommandDisabled(cmd)) {
                return false;
            }
            this.disabledCommands.push(cmd)
            return true
        }

        public enableCommand(cmd: string): boolean {
            if (!this.isCommandDisabled(cmd)) {
                return false;
            }
            this.disabledCommands = this.disabledCommands.filter(command => command !== cmd)
            return true
        }

        public isCommandDisabled(cmd: string): boolean {
            return this.disabledCommands.includes(cmd)
        }

        public getDisabledCommands(): string[] {
            return [...this.disabledCommands]
        }

        public getPrefix(): string {
            return this.prefix
        }

        public setPrefix(prefix: string): boolean {
            if (prefix.length < 1) {
                return false;
            }
            this.prefix = prefix
            return true
        }
    }

    /**
     *
     *
     * @interface ICommand
     * @memberof Command
     */
    interface ICommand {
        name: string
        type: Command.Utility.CommandType
        callback: (...args: any[]) => any

        executeCallback(...args: any[]): Promise<any>
    }

    /**
     *
     *
     * @abstract
     * @class CommandAbstract
     * @implements {ICommand}
     * @memberof Command
     */
    abstract class CommandAbstract implements ICommand {
        public name: string
        public type: Command.Utility.CommandType
        public callback: (...args: any[]) => any
        public constructor(name: string, type: Command.Utility.CommandType, callback: (...args: any[]) => any) {
            this.name = name
            this.type = type
            this.callback = callback
        }

        public abstract async executeCallback(...args: any[]): Promise<any>
    }

    /**
     *
     *
     * @class ConsoleCommand
     * @extends {CommandAbstract}
     * @implements {ICommand}
     * @memberof Command
     */
    class ConsoleCommand extends CommandAbstract implements ICommand {
        public callback: (() => any) | ((args: string[]) => any)
        public constructor(name: string, callback: (() => any) | ((args: string[]) => any)) {
            super(name, Command.Utility.CommandType.console, callback)
            this.callback = callback
        }

        public async executeCallback(): Promise<any>
        public async executeCallback(args: string[]): Promise<any>
        public async executeCallback(args?: string[]): Promise<any> {
            return new Promise((resolve, reject) => {
                setImmediate(() => {
                    try {
                        resolve(this.callback.call(this, args))
                    } catch (ex) {
                        reject(ex)
                    }
                })
            })
        }
    }

    /**
     *
     *
     * @abstract
     * @class DiscordCommand
     * @extends {CommandAbstract}
     * @implements {ICommand}
     * @memberof Command
     */
    abstract class DiscordCommand extends CommandAbstract implements ICommand {
        public type: Command.Utility.CommandType.shared | Command.Utility.CommandType.server | Command.Utility.CommandType.DM
        public callback: (() => any) | ((message: Message) => any) | ((message: Message, args: string[]) => any)
        public constructor(name: string, type: Command.Utility.CommandType.shared | Command.Utility.CommandType.server | Command.Utility.CommandType.DM, callback: (() => any) | ((message: Message) => any) | ((message: Message, args: string[]) => any)) {
            super(name, type, callback)
            this.type = type
            this.callback = callback
        }

        public async executeCallback(): Promise<any>
        public async executeCallback(message: Message): Promise<any>
        public async executeCallback(message: Message, args: string[]): Promise<any>
        public async executeCallback(message?: Message, args?: string[]): Promise<any> {
            return new Promise((resolve, reject) => {
                setImmediate(() => {
                    try {
                        resolve(this.callback.call(this, message, args))
                    } catch (ex) {
                        reject(ex)
                    }
                })
            })
        }
    }

    /**
     *
     *
     * @class DMCommand
     * @extends {DiscordCommand}
     * @implements {ICommand}
     * @memberof Command
     */
    class DMCommand extends DiscordCommand implements ICommand {
        public type: Command.Utility.CommandType.DM
        public constructor(name: string, callback: (() => any) | ((message: Message) => any) | ((message: Message, args: string[]) => any)) {
            super(name, Command.Utility.CommandType.DM, callback)
            this.type = Command.Utility.CommandType.DM
        }
    }

    /**
     *
     *
     * @class ServerCommand
     * @extends {DiscordCommand}
     * @implements {ICommand}
     * @memberof Command
     */
    class ServerCommand extends DiscordCommand implements ICommand {
        public type: Command.Utility.CommandType.server
        public constructor(name: string, callback: (() => any) | ((message: Message) => any) | ((message: Message, args: string[]) => any)) {
            super(name, Command.Utility.CommandType.server, callback)
            this.type = Command.Utility.CommandType.server
        }
    }

    /**
     *
     *
     * @class SharedCommand
     * @extends {DiscordCommand}
     * @implements {ICommand}
     * @memberof Command
     */
    class SharedCommand extends DiscordCommand implements ICommand {
        public type: Command.Utility.CommandType.shared
        public constructor(name: string, callback: (() => any) | ((message: Message) => any) | ((message: Message, args: string[]) => any)) {
            super(name, Command.Utility.CommandType.shared, callback)
            this.type = Command.Utility.CommandType.shared
        }
    }
}

/**
 * @namespace Command.Utility
 * @memberof Command
 */
export namespace Command.Utility {

    /**
     * Represents result of handling commands.
     *
     * @export
     * @class CommandResolveResult
     * @template T
     * @memberof Command.Utility
     */
    export class CommandResolveResult<T extends string | Message> {

        /**
         * @type {boolean}
         * @memberof Command.UtilityCommandResolveResult
         */
        public readonly isCommand: boolean
        /**
         * 
         * @type {T}
         * @memberof Command.UtilityCommandResolveResult
         */
        public readonly message: T

        /**
         * @type {(undefined | string)}
         * @memberof Command.UtilityCommandResolveResult
         */
        public readonly cmd: undefined | string

        /**
         * @type {(undefined | string[])}
         * @memberof Command.UtilityCommandResolveResult
         */
        public readonly args: undefined | string[]

        /**
         * @type {number}
         * @memberof Command.UtilityCommandResolveResult
         */
        public readonly argsCount: number

        /**
         * @type {boolean}
         * @memberof Command.UtilityCommandResolveResult
         */
        public readonly wasExecuted: boolean

        /**
         * @type {CommandType}
         * @memberof Command.UtilityCommandResolveResult
         */
        public readonly calledIn: CommandType

        /**
         * @type {(undefined | CommandType)}
         * @memberof Command.UtilityCommandResolveResult
         */
        public readonly nativeType: undefined | CommandType

        /**
         * @memberof Command.UtilityCommandResolveResult
         */
        public readonly callback: undefined | ((...args: any[]) => any)

        /**
         * @type {*}
         * @memberof Command.UtilityCommandResolveResult
         */
        public readonly executeResult: any

        /**
         * Creates an instance of CommandResolveResult.
         * @param {boolean} isCommand
         * @param {T} message
         * @param {CommandType} calledIn
         * @param {boolean} wasExecuted
         * @param {string} [cmd]
         * @param {string[]} [args]
         * @param {CommandType} [nativeType]
         * @param {(...args: any[]) => any} [callback]
         * @param {*} [execResult]
         * @memberof Command.UtilityCommandResolveResult
         */
        public constructor(isCommand: boolean, message: T, calledIn: CommandType, wasExecuted: boolean, cmd?: string, args?: string[], nativeType?: CommandType, callback?: (...args: any[]) => any, execResult?: any) {
            this.isCommand = isCommand
            this.message = message
            this.cmd = cmd
            this.args = args
            this.argsCount = args !== undefined ? args.length : 0
            this.wasExecuted = wasExecuted
            this.calledIn = calledIn
            this.nativeType = nativeType
            this.callback = callback
            this.executeResult = execResult
        }
    }

    /**
     * Type of command which could be handled.
     *
     * @export
     * @enum {number}
     * @memberof Command.Utility
     */
    export enum CommandType { DM = 0, server = 1, shared = 2, console = 3 }
}

