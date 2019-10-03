import { Message } from 'discord.js'
import * as path from 'path'
import * as fs from 'fs'
import { Log } from './log-module'

/**
 * Contains definitions for handling commands.
 * @namespace Command
 */
export namespace Command {

    /**
     * @type {string}
     * @memberof Command
     */
    const commanddatafile = `.${path.sep}helper-modules${path.sep}command-module.json`

    /**
     * @type {string}
     * @memberof Command
     */
    const defaultprefix = '!'

    /**
     * @type {CommandResolveResult<T extends string | Message>}
     * @memberof Command
     */
    type CommandResolveResult<T extends string | Message> = Command.Utility.CommandResolveResult<T>

    /**
     * Universal method for command handling.
     * @function
     * @export
     * @async
     * @param {Message} message Message which needs to be handled
     * @param {boolean} [executeCallback] Whether callback should be executed immediately
     * @returns {Promise<CommandResolveResult<Message>>}
     * @memberof Command
     */
    export async function onMessage(message: Message, executeCallback?: boolean): Promise<CommandResolveResult<Message>>
    /**
     * @function
     * @async
     * @export
     * @param {string} message
     * @param {boolean} [executeCallback]
     * @returns {Promise<CommandResolveResult<string>>}
     */
    export async function onMessage(message: string, executeCallback?: boolean): Promise<CommandResolveResult<string>>
    /**
     * @export
     * @function
     * @async
     * @param {(string | Message)} message
     * @param {boolean} [executeCallback=true]
     * @returns {(Promise<CommandResolveResult<string> | CommandResolveResult<Message>>)}
     */
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
     * @async
     * @function
     * @export
     * @param {string} message Message which needs to be handled
     * @param {boolean} [executeCallback=true] Whether callback should be executed immediately
     * @returns {Promise<CommandResolveResult<string>>}
     * @memberof Command
     */
    export async function onConsoleMessage(message: string, executeCallback: boolean = true): Promise<CommandResolveResult<string>> {
        return CommandInternal.Instance.onConsoleMessage(message, executeCallback)
    }

    /**
     * Method for hadnling discord commands and messages.
     * @async
     * @function
     * @export
     * @param {Message} message Message which needs to be handled
     * @param {boolean} [executeCallback=true] Whether callback should be executed immediately
     * @returns {Promise<CommandResolveResult<Message>>}
     * @memberof Command
     */
    export async function onDiscordMessage(message: Message, executeCallback: boolean = true): Promise<CommandResolveResult<Message>> {
        return CommandInternal.Instance.onDiscordMessage(message, executeCallback)
    }

    /**
     * Get all existing commands.
     * @function
     * @export
     * @returns {object[]} Array with objects ({ name: string, type: Command.Utility.CommandType }[])
     * @memberof Command
     */
    export function getCommands(): { name: string, type: Command.Utility.CommandType }[] {
        return CommandInternal.Instance.getCommands()
    }

    /**
     * Get callback(s) for specifies command name.
     * @export
     * @param {string} cmd Command name
     * @returns {object | object[] | undefined} *object represents ICommand['callback'] | object[] represents { type: Command.Utility.CommandType, callback: ICommand['callback'] }[]*
     * @memberof Command
     */
    export function getCallback(cmd: string): ICommand['callback'] | { type: Command.Utility.CommandType, callback: ICommand['callback'] }[] | undefined {
        return CommandInternal.Instance.getCallback(cmd)
    }

    /**
     * Register new command.
     * @export
     * @function
     * @param {string} cmd Command name
     * @param {(Command.Utility.CommandType.DM | Command.Utility.CommandType.server | Command.Utility.CommandType.shared)} type Command type
     * @param {object} callback Command callback. *object represents DiscordCommand['callback']*
     * @returns {boolean}
     * @memberof Command
     */
    export function registerCommand(cmd: string, type: Command.Utility.CommandType.DM | Command.Utility.CommandType.server | Command.Utility.CommandType.shared, callback: DiscordCommand['callback']): boolean
    /**
     * @export
     * @function
     * @param {string} cmd
     * @param {Command.Utility.CommandType.console} type
     * @param {object} callback *object represents ConsoleCommand['callback']*
     * @returns {boolean}
     */
    export function registerCommand(cmd: string, type: Command.Utility.CommandType.console, callback: ConsoleCommand['callback']): boolean
    /**
     * @export
     * @function
     * @param {string} cmd
     * @param {Command.Utility.CommandType} type
     * @param {object} callback *object represents ICommand['callback']*
     * @returns {boolean}
     */
    export function registerCommand(cmd: string, type: Command.Utility.CommandType, callback: ICommand['callback']): boolean {
        return CommandInternal.Instance.registerCommand(cmd, type, callback)
    }

    /**
     * Remove command from data.
     * @function
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
     * Get current prefix on server or in DM
     *
     * @export
     * @param {string} id server/user id
     * @returns {string} current prefix
     */
    export function getPrefix(id: string): string {
        return CommandInternal.Instance.getPrefix(id)
    }


    /**
     * Set new prefix for server or specific user
     *
     * @export
     * @param {string} id server/user id
     * @param {string} prefix new prefix
     * @returns {boolean} whether prefix was set or not (if it is unappropriate)
     */
    export function setPrefix(id: string, prefix: string) {
        return CommandInternal.Instance.setPrefix(id, prefix)
    }

    class CommandInternal {
        private static _instance: CommandInternal
        private data: Data[]
        private commands: ICommand[]

        public constructor() {
            this.data = new Array<Data>()
            this.commands = new Array<ICommand>()
            this.loadData()
        }

        public async onDiscordMessage(message: Message, execute: boolean): Promise<Command.Utility.CommandResolveResult<Message>> {
            return new Promise(resolve => {
                var cmd = this.parseCommand(message)
                const ct = message.guild == undefined ? Command.Utility.CommandType.DM : Command.Utility.CommandType.server
                if (cmd === undefined) {
                    resolve(new Command.Utility.CommandResolveResult(false, message, ct, false))
                }
                else {
                    const args = this.parseArguments(message.content)

                    var commands = this.findCommands(cmd)

                    if (commands === undefined) {
                        resolve(new Command.Utility.CommandResolveResult(true, message, ct, false, cmd, args))
                    }
                    else {
                        const exactCommand = this.findCommands(cmd, ct) as DiscordCommand
                        if (exactCommand == undefined) {
                            resolve(new Command.Utility.CommandResolveResult(true, message, ct, false, cmd, args, commands[0].type, commands[0].callback))
                        }
                        else if (this.isCommandDisabled(ct === Utility.CommandType.DM ? message.author.id : message.guild.id, cmd)) {
                            resolve(new Command.Utility.CommandResolveResult(true, message, ct, false, cmd, args, exactCommand.type, exactCommand.callback))
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

        private parseCommand(command: string | Message): string | undefined {
            if (typeof command === 'string') {
                const cmd = command.split(' ')[0].trim().toLowerCase()
                if (cmd.length < 1) {
                    return undefined
                }
                return cmd
            }
            else {
                let prefix = command.guild == undefined ? this.getPrefix(command.author.id) : this.getPrefix(command.guild.id)
                const array = command.content.split(' ')
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

        private parseArguments(msg: string) {
            const args = new Array<string>(0);
            let index = msg.indexOf(' ')
            msg = msg.substr(index).trim();

            if (index === -1 || msg.length < 1) {
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
                        const t = current.trim();
                        if (t != null && t.length > 0) {
                            args.push(t);
                        }
                        flag = false;
                        current = ''
                    }
                }
                else if (char.match(/\s+/g) && !flag) {
                    const t = current.trim();
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
            const t = current.trim();
            if (t != null && t.length > 0) {
                args.push(t);
            }
            flag = false;
            current = ''
            return args;
        }

        public getPrefix(id: string) {
            return this.getData(id).getPrefix()
        }

        public setPrefix(id: string, prefix: string): boolean {
            const res = this.getData(id).setPrefix(prefix);
            if (res) {
                fs.mkdirSync(path.dirname(commanddatafile), { recursive: true })
                fs.writeFileSync(commanddatafile, JSON.stringify(this.data))
            }
            return res
        }

        public isCommandDisabled(id: string, name: string): boolean {
            return this.getData(id).isCommandDisabled(name)
        }

        public getDisabledCommands(id: string): string[] {
            return this.getData(id).getDisabledCommands()
        }

        public enableCommand(id: string, name: string): boolean {
            return this.getData(id).enableCommand(name)
        }

        public disableCommand(id: string, name: string): boolean {
            return this.getData(id).disableCommand(name)
        }

        private getData(id: string): Data {
            var data = this.data.find(d => d.id === id)
            if (data === undefined) {
                data = new Data(id)
                this.data.push(data)
                fs.writeFileSync(commanddatafile, JSON.stringify(this.data))
            }
            return data;
        }

        public getCommands(): { name: string, type: Command.Utility.CommandType }[] {
            return this.commands.map(cmd => {
                return {
                    name: cmd.name,
                    type: cmd.type
                }
            })
        }

        public getCallback(name: string): undefined | ICommand['callback'] | { type: Command.Utility.CommandType, callback: ICommand['callback'] }[]
        public getCallback(name: string, type: Command.Utility.CommandType.DM | Command.Utility.CommandType.server | Command.Utility.CommandType.shared): undefined | typeof DiscordCommand.prototype.callback
        public getCallback(name: string, type: Command.Utility.CommandType.console): undefined | typeof ConsoleCommand.prototype.callback
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

        public unregisterCommand(cmd: string): boolean {
            if (this.commands.find((command) => command.name === cmd) === undefined) {
                return false;
            }
            this.commands = this.commands.filter(command => command.name !== cmd)
            return true
        }

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
                let temp = new Data('default')
                this.data.forEach(d => {
                    d.disableCommand = temp.disableCommand.bind(d)
                    d.enableCommand = temp.enableCommand.bind(d)
                    d.getDisabledCommands = temp.getDisabledCommands.bind(d)
                    d.getPrefix = temp.getPrefix.bind(d)
                    d.isCommandDisabled = temp.isCommandDisabled.bind(d)
                    d.setPrefix = temp.setPrefix.bind(d)
                })

            } catch (ex) {
                Log.logError(ex)
                fs.unlinkSync(commanddatafile)
                this.loadData()
            }
        }

        public static get Instance(): CommandInternal {
            if (CommandInternal._instance === undefined) {
                CommandInternal._instance = new CommandInternal()
            }
            return CommandInternal._instance
        }
    }

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

    interface ICommand {
        name: string
        type: Command.Utility.CommandType
        callback: (...args: any[]) => any

        executeCallback(...args: any[]): Promise<any>
    }

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

    class DMCommand extends DiscordCommand implements ICommand {
        public type: Command.Utility.CommandType.DM
        public constructor(name: string, callback: (() => any) | ((message: Message) => any) | ((message: Message, args: string[]) => any)) {
            super(name, Command.Utility.CommandType.DM, callback)
            this.type = Command.Utility.CommandType.DM
        }
    }

    class ServerCommand extends DiscordCommand implements ICommand {
        public type: Command.Utility.CommandType.server
        public constructor(name: string, callback: (() => any) | ((message: Message) => any) | ((message: Message, args: string[]) => any)) {
            super(name, Command.Utility.CommandType.server, callback)
            this.type = Command.Utility.CommandType.server
        }
    }

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
     * @export
     * @class CommandResolveResult
     * @template T
     * @memberof Command.Utility
     */
    export class CommandResolveResult<T extends string | Message> {
        /**
         * @public
         * @readonly
         * @type {boolean}
         * @memberof Command.Utility.CommandResolveResult
         */
        public readonly isCommand: boolean
        /**
         * @public
         * @readonly
         * @type {T}
         * @memberof Command.Utility.CommandResolveResult
         */
        public readonly message: T
        /**
         * @public
         * @readonly
         * @type {undefined | string}
         * @memberof Command.Utility.CommandResolveResult
         */
        public readonly cmd: undefined | string
        /**
         * @public
         * @readonly
         * @type {undefined | string[]}
         * @memberof Command.Utility.CommandResolveResult
         */
        public readonly args: undefined | string[]
        /**
         * @public
         * @readonly
         * @type {number}
         * @memberof Command.Utility.CommandResolveResult
         */
        public readonly argsCount: number
        /**
         * @public
         * @readonly
         * @type {boolean}
         * @memberof Command.Utility.CommandResolveResult
         */
        public readonly wasExecuted: boolean
        /**
         * @public
         * @readonly
         * @type {CommandType}
         * @memberof Command.Utility.CommandResolveResult
         */
        public readonly calledIn: CommandType
        /**
         * @public
         * @readonly
         * @type {undefined | CommandType}
         * @memberof Command.Utility.CommandResolveResult
         */
        public readonly nativeType: undefined | CommandType
        /**
         * @public
         * @readonly
         * @type {undefined | Function} *Function represents (...args: any[]) => any*
         * @memberof Command.UtilityCommandResolveResult
         */
        public readonly callback: undefined | ((...args: any[]) => any)
        /**
         * @public
         * @readonly
         * @type {*}
         * @memberof Command.Utility.CommandResolveResult
         */
        public readonly executeResult: any

        /**
         * Creates an instance of CommandResolveResult.
         * @constructor
         * @public
         * @param {boolean} isCommand
         * @param {T} message
         * @param {CommandType} calledIn
         * @param {boolean} wasExecuted
         * @param {string} [cmd]
         * @param {string[]} [args]
         * @param {CommandType} [nativeType]
         * @param {Function} [callback] *Function represents (...args: any[]) => any*
         * @param {*} [execResult]
         * @memberof Command.Utility.CommandResolveResult
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
     * @export
     * @enum {number}
     * @memberof Command.Utility
     */
    export enum CommandType { DM = 0, server = 1, shared = 2, console = 3 }
}

