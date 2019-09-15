import { Message, User } from 'discord.js'
import * as fs from 'fs'
import Log from './log'

export namespace Command {

    namespace Command.Internal {
        export class CommandHandler {
            data: Data[]
            commands: ICommand[]
            defaultprefix: string
            constructor(defaultprefix: string = '!') {
                this.data = new Array<Data>()
                this.commands = new Array<ICommand>()
                this.defaultprefix = defaultprefix
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
    
                var typedCommands = discordCommands.filter(cmd => cmd.type == calledtype || cmd.type == CommandType.shared)
    
                if (typedCommands.length < 1) {
                    return new CommandResolveResult(true, message.content, message, command, args, calledtype, matchingCommands[0].type)
                }
                else { //FORGOT TO MAKE FILTER BY SERVER/SHARED/DM !!!!!!!!!!!!!!
                    //PREFIX SETTING DOES NOT WORK OR SOMETHING
                    let exactCommand = typedCommands[0]
                    let callback = exactCommand.callback
                    callback.call(this, message, args)
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
                this.saveData()
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
                    this.saveData()
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
    
            public registerCommand(name: string, type: CommandType, callback: (...args) => void) {
                name = name.toLowerCase()
                Log.reservedCharacters.forEach(char => {
                    if (name.includes(char)) {
                        return false;
                    }
                })
    
                if (this.findCommands(name, type).length > 0) {
                    return false;
                }
    
                var commands = this.findCommands(name)
                if (commands.length > 0) {
                    if (type == CommandType.shared) { //replacing server/dm commands with shared type
                        commands.forEach(cmd => {
                            if (cmd.type != CommandType.console) {
                                this.unregisterCommand(cmd.name, cmd.type)
                            }
                        })
                    }
                    else if (commands.filter(cmd => cmd.type == CommandType.shared).length > 0 && type != CommandType.console) { // we already have shared command, why would we register server/dm? (to make different callbacks in DM / on server => use specific command types)
                        return false;
                    }
                }
    
                var cmd: ICommand
                switch (type) {
                    case CommandType.console:
                        cmd = new ConsoleCommand(name, callback)
                        break;
    
                    case CommandType.DM:
                        cmd = new DMCommand(name, callback)
                        break;
    
                    case CommandType.shared:
                        cmd = new SharedCommand(name, callback)
                        break;
    
                    case CommandType.server:
                        cmd = new ServerCommand(name, callback)
                        break;
                    default:
                        return false;
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
                    this.commands = this.commands.filter((cmd) => {
                        return !(cmd.name == name && cmd.type == type)
                    })
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
    
            private parseCommand(command: string | Message): string | undefined {
                if (typeof command == 'string') {
                    let cmd = command.split(' ')[0].trim().toLowerCase()
                    if (cmd.length < 1) {
                        return undefined
                    }
                    return cmd
                }
                else {
                    let prefix = command.guild == undefined ? this.findPrefix(command.author.id) : this.findPrefix(command.guild.id)
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
                    let tempdata = JSON.parse(json) as Data[]
                    tempdata.forEach((data, index) => {
                        this.data[index] = new Data(data.id, data.prefix, data.disabledcommands)
                    })
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
    }

    const datapath = './commands_data.json'

    const logger = new Log.LogHandler('command-module')

    const handlers = new Array<Command.Internal.CommandHandler>()

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
        readonly index: number
        //data: Data[]
        //commands: ICommand[]
        //defaultprefix: string
        constructor(defaultprefix: string = '!') {
            this.index = handlers.length
            var handler = new Command.Internal.CommandHandler(defaultprefix)
            handlers[this.index] = handler
            //this.defaultprefix = defaultprefix
            //this.data = new Array<Data>()
            //this.commands = new Array<ICommand>()
            //this.loadData()
        }

        onDiscordMessage(message: Message): CommandResolveResult {
            return handlers[this.index].onDiscordMessage(message)
            // var command = this.parseCommand(message)
            // var calledtype = message.guild == undefined ? CommandType.DM : CommandType.server
            // if (command == undefined) {
            //     return new CommandResolveResult(false, message.content, message, command, undefined, calledtype, undefined)
            // }

            // var args = this.parseArguments(message.content)

            // var matchingCommands = this.findCommands(command)

            // if (matchingCommands.length < 1) {
            //     return new CommandResolveResult(true, message.content, message, command, args, calledtype, undefined)
            // }

            // var discordCommands = matchingCommands.filter(cmd => cmd instanceof DiscordCommand)

            // if (discordCommands.length < 1) {
            //     return new CommandResolveResult(true, message.content, message, command, args, calledtype, matchingCommands[0].type)
            // }

            // var typedCommands = discordCommands.filter(cmd => cmd.type == calledtype || cmd.type == CommandType.shared)

            // if (typedCommands.length < 1) {
            //     return new CommandResolveResult(true, message.content, message, command, args, calledtype, matchingCommands[0].type)
            // }
            // else { //FORGOT TO MAKE FILTER BY SERVER/SHARED/DM !!!!!!!!!!!!!!
            //     //PREFIX SETTING DOES NOT WORK OR SOMETHING
            //     let exactCommand = typedCommands[0]
            //     let callback = exactCommand.callback
            //     callback.call(this, message, args)
            //     return new CommandResolveResult(true, message.content, message, command, args, calledtype, exactCommand.type)
            // }
        }

        onConsoleMessage(message: string): CommandResolveResult {
            return handlers[this.index].onConsoleMessage(message)
            // var command = this.parseCommand(message)
            // if (command == undefined) {
            //     return new CommandResolveResult(false, message, undefined, command, undefined, CommandType.console, undefined)
            // }
            // var args = this.parseArguments(message)

            // var matchingCommands = this.findCommands(command)

            // if (matchingCommands.length < 1) {
            //     return new CommandResolveResult(true, message, undefined, command, args, CommandType.console, undefined)
            // }
            // else if (matchingCommands.filter(cmd => cmd.type == CommandType.console).length < 1) {
            //     return new CommandResolveResult(true, message, undefined, command, args, CommandType.console, matchingCommands[0].type)
            // }
            // else {
            //     let exactCommand = matchingCommands.filter(cmd => cmd.type == CommandType.console)[0]
            //     let callback = exactCommand.callback
            //     callback.call(this, args)
            //     return new CommandResolveResult(true, message, undefined, command, args, CommandType.console, exactCommand.type)
            // }
        }

        setPrefix(id: string, prefix: string) {
            handlers[this.index].setPrefix(id, prefix)
            // var target = this.findData(id)
            // target.setNewPrefix(prefix)
            // this.saveData()
        }

        findPrefix(id: string): string {
            return handlers[this.index].findPrefix(id)
            // var target = this.findData(id)
            // return target.getCurrentPrefix()
        }

        // findData(id: string) {
        //     var data = this.data.find(data => data.id == id)
        //     if (data == undefined) {
        //         data = new Data(id, this.defaultPrefix)
        //         this.data.push(data)
        //         this.saveData()
        //     }
        //     return data
        // }

        get defaultPrefix() {
            return handlers[this.index].defaultPrefix
            //return this.defaultprefix
        }

        set defaultPrefix(prefix) {
            handlers[this.index].defaultPrefix = prefix
            // if (prefix.trim().length > 0) {
            //     this.defaultprefix = prefix
            // }
        }

        registerCommand(name: string, type: CommandType, callback: (...args) => void) {
            return handlers[this.index].registerCommand(name,type,callback)
            // name = name.toLowerCase()
            // Log.reservedCharacters.forEach(char => {
            //     if (name.includes(char)) {
            //         return false;
            //     }
            // })

            // if (this.findCommands(name, type).length > 0) {
            //     return false;
            // }

            // var commands = this.findCommands(name)
            // if (commands.length > 0) {
            //     if (type == CommandType.shared) { //replacing server/dm commands with shared type
            //         commands.forEach(cmd => {
            //             if (cmd.type != CommandType.console) {
            //                 this.unregisterCommand(cmd.name, cmd.type)
            //             }
            //         })
            //     }
            //     else if (commands.filter(cmd => cmd.type == CommandType.shared).length > 0 && type != CommandType.console) { // we already have shared command, why would we register server/dm? (to make different callbacks in DM / on server => use specific command types)
            //         return false;
            //     }
            // }

            // var cmd: ICommand
            // switch (type) {
            //     case CommandType.console:
            //         cmd = new ConsoleCommand(name, callback)
            //         break;

            //     case CommandType.DM:
            //         cmd = new DMCommand(name, callback)
            //         break;

            //     case CommandType.shared:
            //         cmd = new SharedCommand(name, callback)
            //         break;

            //     case CommandType.server:
            //         cmd = new ServerCommand(name, callback)
            //         break;
            //     default:
            //         return false;
            // }
            // //@ts-ignore //Could properly make a assignment, but I'm lazy and this looks better even tho analyzer throws error
            // this.commands.push(cmd)
            // return true;
        }

        unregisterCommand(name: string, type: CommandType) {
            return handlers[this.index].unregisterCommand(name, type)
            // var commands = this.findCommands(name, type)
            // if (commands.length < 1) {
            //     return false;
            // }
            // else {
            //     this.commands = this.commands.filter((cmd) => {
            //         return !(cmd.name == name && cmd.type == type)
            //     })
            //     return true;
            // }
        }

        findCommands(name: string, type?: CommandType) {
            // if (type === undefined) {
            //     return this.commands.filter(cmd => cmd.name == name)
            // }
            // else {
            //     return this.commands.filter(cmd => cmd.name == name && cmd.type == type)
            // }
            return handlers[this.index].findCommands(name, type)
        }

        // private parseCommand(command: string | Message): string | undefined {
        //     if (typeof command == 'string') {
        //         let cmd = command.split(' ')[0].trim().toLowerCase()
        //         if (cmd.length < 1) {
        //             return undefined
        //         }
        //         return cmd
        //     }
        //     else {
        //         let prefix = command.guild == undefined ? this.findPrefix(command.author.id) : this.findPrefix(command.guild.id)
        //         let array = command.content.split(' ')
        //         if (array.length < 1) {
        //             return undefined;
        //         }
        //         let cmd = array[0]

        //         if (!cmd.startsWith(prefix)) {
        //             return undefined;
        //         }

        //         cmd = cmd.replace(prefix, '').trim().toLowerCase()
        //         if (cmd.length < 1) {
        //             return undefined
        //         }
        //         return cmd
        //     }
        // }

        // private parseArguments(msg: string) {
        //     var args = new Array<string>(0);
        //     let index = msg.indexOf(' ')
        //     msg = msg.substr(index).trim();

        //     if (index == -1 || msg.length < 1) {
        //         return args;
        //     }

        //     let flag = false;
        //     let current = ''
        //     for (let i = 0; i < msg.length; i++) {
        //         let char = msg[i];
        //         if (char == '"') {
        //             if (!flag) {
        //                 flag = true;
        //             }
        //             else {
        //                 let t = current.trim();
        //                 if (t != null && t.length > 0) {
        //                     args.push(t);
        //                 }
        //                 flag = false;
        //                 current = ''
        //             }
        //         }
        //         else if (char.match(/\s+/g) && !flag) {
        //             let t = current.trim();
        //             if (t != null && t.length > 0) {
        //                 args.push(t);
        //             }
        //             flag = false;
        //             current = ''
        //         }
        //         else {
        //             current += char;
        //         }
        //     }
        //     let t = current.trim();
        //     if (t != null && t.length > 0) {
        //         args.push(t);
        //     }
        //     flag = false;
        //     current = ''
        //     return args;
        // }

        // private loadData() {
        //     if (!fs.existsSync(datapath)) {
        //         this.saveData();
        //     }

        //     let json = fs.readFileSync(datapath, { encoding: 'utf-8', flag: 'r' })
        //     try {
        //         let tempdata = JSON.parse(json) as Data[]
        //         tempdata.forEach((data, index) => {
        //             this.data[index] = new Data(data.id, data.prefix, data.disabledcommands)
        //         })
        //     } catch (ex) {
        //         this.data = new Array<Data>()
        //         fs.unlinkSync(datapath)
        //         this.loadData()
        //     }
        // }

        private saveData() {
            // fs.writeFileSync(datapath, JSON.stringify(this.data, null, '\t'))
            handlers[this.index].saveData()
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
        prefix: string;
        disabledcommands: string[];

        constructor(id: string, prefix: string, disabledcommands?: string[]) {
            this.id = id;
            this.prefix = prefix;
            if (disabledcommands == undefined) {
                this.disabledcommands = new Array<string>();
            }
            else {
                this.disabledcommands = disabledcommands
            }
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