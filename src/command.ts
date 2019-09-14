import { Message, User } from 'discord.js'
import * as fs from 'fs'
import Log from './log'

export namespace Command {

    const datapath = './commands_data.json'

    const logger = new Log.LogHandler('command-module')

    export interface ICommand {
        name: string;
        type: CommandType
        callback: (...params) => void
    }

    class ConsoleCommand implements ICommand {
        name: string;
        type: CommandType.console = CommandType.console;
        callback: (() => void) | ((args: string[]) => void)

        constructor(name: string, callback: (() => void) | ((args: string[]) => void)) {
            this.name = name;
            this.callback = callback
        }
    }

    abstract class DiscordCommand implements ICommand {
        name: string;
        type: CommandType.DM | CommandType.shared | CommandType.server
        callback: (() => void) | ((msg: Message) => void) | ((msg: Message, args: string[]) => void)

        constructor(name: string, type: CommandType.DM | CommandType.shared | CommandType.server, callback: (() => void) | ((msg: Message) => void) | ((msg: Message, args: string[]) => void)) {
            this.name = name;
            this.type = type;
            this.callback = callback;
        }
    }

    class DMCommand extends DiscordCommand implements ICommand {
        constructor(name: string, callback: (() => void) | ((msg: Message) => void) | ((msg: Message, args: string[]) => void)) {
            super(name, CommandType.DM, callback)
        }
    }

    class ServerCommand extends DiscordCommand implements ICommand {
        constructor(name: string, callback: (() => void) | ((msg: Message) => void) | ((msg: Message, args: string[]) => void)) {
            super(name, CommandType.server, callback)
        }
    }

    class SharedCommand extends DiscordCommand implements ICommand {
        constructor(name: string, callback: (() => void) | ((msg: Message) => void) | ((msg: Message, args: string[]) => void)) {
            super(name, CommandType.shared, callback)
        }
    }

    export class CommandHandler {
        data: Data[]
        commands: ICommand[]
        defaultprefix: string
        constructor(defaultprefix: string = '!') {
            this.defaultprefix = defaultprefix
            this.data = new Array<Data>()
            this.commands = new Array<ICommand>()
            this.loadData()
        }

        onDiscordMessage(message: Message): CommandResolveResult {
            var command = this.parseCommand(message)
            var calledtype = message.guild == undefined ? CommandType.DM : CommandType.server
            if (command == undefined) {
                return new CommandResolveResult(false, message.content, message, command, undefined, calledtype, undefined)
            }

            var args = this.parseArguments(message.content)

            var matchingCommands = this.findCommands(command)

            if (matchingCommands.length < 1) {
                return new CommandResolveResult(true, message.content, message, command, args, calledtype, undefined)
            }

            var discordCommands = matchingCommands.filter(cmd => cmd instanceof DiscordCommand)

            if (discordCommands.length < 1) {
                return new CommandResolveResult(true, message.content, message, command, args, calledtype, matchingCommands[0].type)
            }
            else{
                let exactCommand = discordCommands[0]
                let callback = exactCommand.callback
                callback.call(this, args)
                return new CommandResolveResult(true, message.content, message, command, args, calledtype, exactCommand.type)
            }
        }

        onConsoleMessage(message: string): CommandResolveResult {
            var command = this.parseCommand(message)
            if (command == undefined) {
                return new CommandResolveResult(false, message, undefined, command, undefined, CommandType.console, undefined)
            }
            var args = this.parseArguments(message)

            var matchingCommands = this.findCommands(command)

            if (matchingCommands.length < 1) {
                return new CommandResolveResult(true, message, undefined, command, args, CommandType.console, undefined)
            }
            else if (matchingCommands.filter(cmd => cmd.type == CommandType.console).length < 1) {
                return new CommandResolveResult(true, message, undefined, command, args, CommandType.console, matchingCommands[0].type)
            }
            else {
                let exactCommand = matchingCommands.filter(cmd => cmd.type == CommandType.console)[0]
                let callback = exactCommand.callback
                callback.call(this, args)
                return new CommandResolveResult(true, message, undefined, command, args, CommandType.console, exactCommand.type)
            }
        }

        setPrefix(id: string, prefix: string) {
            var target = this.findData(id)
            target.setNewPrefix(prefix)
        }

        findPrefix(id: string): string {
            var target = this.findData(id)
            return target.getCurrentPrefix()
        }

        findData(id: string) {
            var data = this.data.find(data => data.id == id)
            if (data == undefined) {
                data = new Data(id, this.defaultPrefix)
                this.data.push(data)
            }
            return data
        }

        get defaultPrefix() {
            return this.defaultprefix
        }

        set defaultPrefix(prefix) {
            if (prefix.trim().length > 0) {
                this.defaultprefix = prefix
            }
        }

        registerCommand(command: ICommand) {
            if (this.findCommands(command.name, command.type).length > 0) {
                return false;
            }
            var cmd: ICommand
            var flag: boolean
            switch (command.type) {
                case CommandType.console:
                    cmd = new ConsoleCommand(command.name, command.callback)
                    break;

                case CommandType.DM:
                    cmd = new DMCommand(command.name, command.callback)
                    break;

                case CommandType.shared:
                    cmd = new SharedCommand(command.name, command.callback)
                    break;

                case CommandType.server:
                    cmd = new ServerCommand(command.name, command.callback)
                    break;
            }
            //@ts-ignore //Could properly make a assignment, but I'm lazy and this looks better even tho analyzer throws error
            this.commands.push(cmd)
            return true;
        }

        unregisterCommand(name: string, type: CommandType) {
            var commands = this.findCommands(name, type)
            if (commands.length < 1) {
                return false;
            }
            else {
                delete this.commands[this.commands.findIndex((cmd) => cmd.name == name && cmd.type == type)]
                return true;
            }
        }

        findCommands(name: string, type?: CommandType) {
            if (type === undefined) {
                return this.commands.filter(cmd => cmd.name == name)
            }
            else {
                return this.commands.filter(cmd => cmd.name == name && cmd.type == type)
            }
        }

        parseCommand(command: string | Message): string | undefined {
            if (typeof command == 'string') {
                let cmd = command.split(' ')[0].trim().toLowerCase()
                if (cmd.length < 1) {
                    return undefined
                }
                return cmd
            }
            else {
                let prefix = this.findPrefix(command.author.id)
                let array = command.content.split(' ')
                if (array.length < 1) {
                    return undefined;
                }
                let cmd = array[0]

                if (!cmd.includes(prefix)) {
                    return undefined;
                }

                cmd = cmd.replace(prefix, '').trim().toLowerCase()
                if (cmd.length < 1) {
                    return undefined
                }
                return cmd
            }
        }

        parseArguments(msg: string) {
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

        loadData() {
            if (!fs.existsSync(datapath)) {
                this.saveData();
            }

            let json = fs.readFileSync(datapath, { encoding: 'utf-8', flag: 'r' })
            try {
                this.data = JSON.parse(json);
            } catch (ex) {
                this.data = new Array<Data>()
                fs.unlinkSync(datapath)
                this.loadData()
            }
        }

        saveData() {
            fs.writeFileSync(datapath, JSON.stringify(this.data, null, '\t'))
        }
    }

    /**
     * Object which is retuned from the message handlers
     */
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
        constructor(iscmd: boolean, text: string, msg: Message | undefined, cmd: string | undefined, args: string[] | undefined, calledIn: CommandType, nativeIn: CommandType | undefined) {
            this.isCommand = iscmd
            this.message = msg
            this.cmd = cmd
            this.args = args
            this.text = text
            this.argsCount = args != undefined ? args.length : 0
            this.nativeIn = nativeIn;
            this.calledIn = calledIn
            this.wasExecuted = nativeIn == calledIn || (nativeIn == CommandType.shared && (calledIn == CommandType.DM || calledIn == CommandType.server))
        }
    }

    /**
     * Represents the type of command object
     */
    export enum CommandType { DM = 0, server = 1, shared = 2, console = 3 }

    class Data {
        readonly id: string;
        private prefix: string;
        private disabledcommands: string[];

        constructor(id: string, prefix: string) {
            this.id = id;
            this.prefix = prefix;
            this.disabledcommands = new Array<string>();
        }

        enableCommand(cmd: string) {
            if (this.isCommandDisabled(cmd)) {
                delete this.disabledcommands[this.disabledcommands.indexOf(cmd)]
            }
        }

        disableCommand(cmd: string) {
            if (!this.isCommandDisabled(cmd)) {
                this.disabledcommands.push(cmd)
            }
        }

        isCommandDisabled(command: string) {
            return this.disabledcommands.includes(command)
        }

        getDisabledCommands() {
            let dcom = new Array<string>(0);
            this.disabledcommands.forEach(cmd => {
                dcom.push(cmd)
            })
            return dcom;
        }

        getCurrentPrefix() {
            return this.prefix
        }

        setNewPrefix(newprefix: string) {
            if (newprefix == null || newprefix.length < 1 || newprefix.includes(' ')) {
                return false;
            }

            this.prefix = newprefix;
            return true;
        }
    }
}

export default Command