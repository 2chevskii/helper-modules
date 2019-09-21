[npmjs]: https://www.npmjs.com/package/discord-bot-helpers
[github]: https://github.com/2chevskii/discord-bot-helpers
[license]: https://www.tldrlegal.com/l/mit
[discord]: https://discord.gg/DBaqZNZ

## Discord bot helpers [![npmjs](https://img.shields.io/npm/v/discord-bot-helpers)][npmjs] [![license](https://img.shields.io/github/license/2chevskii/discord-bot-helpers)][license] [![discord](https://discordapp.com/api/guilds/266961601784053781/embed.png)][discord] ![](https://img.shields.io/github/last-commit/2chevskii/discord-bot-helpers?style=flat)
> Provides various helpers to make writing discord bots easier

## Contents

- [Discord bot helpers](#discord-bot-helpers-npmjsnpmjs-licensegithub)
- [Contents](#contents)
- [Installation](#installation)
- [Features](#features)
- [Logging](#logging)
  - [Initialization](#initialization)
  - [Logging into console](#logging-into-console)
  - [Writing log into file](#writing-log-into-file)
  - [Reading last log entries](#reading-last-log-entries)
- [Localization](#localization)
  - [Initialization](#initialization-1)
  - [(De)Initializing additional languages](#deinitializing-additional-languages)
  - [Getting and setting server localization preference](#getting-and-setting-server-localization-preference)
  - [Getting localized messages](#getting-localized-messages)
- [Handling commands](#handling-commands)
  - [Initialization](#initialization-2)
  - [(Un)Registering commands](#unregistering-commands)
  - [Handling inputs](#handling-inputs)
    - [Handling console input](#handling-console-input)
    - [Handling discord messages](#handling-discord-messages)
    - [Recomendations and guidelines](#recomendations-and-guidelines)
- [Roadmap](#roadmap)
- [Credits](#credits)
- [Pages](#pages)

## Installation
To install the package simply run:<br>
`npm i discord-bot-helpers`<br>
If you are installing from the repo, you'd probably need to install dependencies:<br>
`npm i`<br>

## Features
- [x] Easy logging with `LogHandler` class
- [x] Easy localizing bot on different servers with `LanguageHandler` class
- [x] Easy processing commands with `CommandHandler` class

> Note that provided library does not use `async` features yet, it will be improved later. Try to avoid logging every single message, if your bot works in 1000+ guilds, that can downgrade the performance for a significant amount

> Also don't forget that this library is highly WIP, things might change throughout the time<br>
> This documentation is official, but not necessarily contain all the latest info. JSDoc comments are more precise at this point<br>
> Latest buildable version of package will always be located in 'develop' branch, 'master' is for stable and fully tested versions

## Logging
`LogHandler` class is intended to be used as logger.

### Initialization
At first, create a new instance of it:
<br><span style="color:#009988">TypeScript</span> example
```ts
import * as helpers from 'discord-bot-helpers'

const logger = new helpers.LogHandler(); //prefix for log files will be 'bot' in this case ('bot_yyyy_mm_dd.log')
```

<br><span style="color:#ffff00">JavaScript</span> example
```js
const helpers = require('discord-bot-helpers')

const logger = new helpers.LogHandler('app'); //prefix for log files will be 'app' in this case ('app_yyyy_mm_dd.log')
```
### Logging into console
You can log messages into console using `LogHandler.writeLog(data: any, timestamp?: boolean)` method:
<br><span style="color:#009988">TypeScript</span> | <span style="color:#ffff00">JavaScript</span> example
```js
logger.writeLog('Hello world!') // [Date and time] Hello world!
logger.writeLog('This log message does not have a timestamp, wow!', false) // This log message does not have a timestamp, wow!
```

### Writing log into file
You can log messages into logfile using `LogHandler.writeLogFile(data: any, timestamp?: boolean, toConsole?: boolean)` method:
<br><span style="color:#009988">TypeScript</span> | <span style="color:#ffff00">JavaScript</span> example
```js
logger.writeLogFile('This log string will be printed inside of the log file and console!')
logger.writeLogFile("But this won't appear in console", true, false)
```

### Reading last log entries
This library also provides method to read last log entries using `LogHandler.showlog(count?: number)` method:
<br><span style="color:#009988">TypeScript</span> | <span style="color:#ffff00">JavaScript</span> example
```js
logger.showLog() // returns an array with last 10 (or less, if logfile is not long enough) log entries
logger.showLog(30) // returns an array with last 30 (or less, if logfile is not long enough) log entries
```

## Localization
`LanguageHandler` class might help you create multilanguage bots much easier
### Initialization
You'd need to create new instance of the class:
<br><span style="color:#009988">TypeScript</span> example
```ts
import * as helpers from 'discord-bot-helpers'

const lang = new helpers.LanguageHandler({
    "Key 1": "Phrase 1",
    "Key 2": "Message 2 is here"
}) // Creates default localization file in './locales/lang_en.json'
```

<br><span style="color:#ffff00">JavaScript</span> example
```js
const helpers = require('discord-bot-helpers')

const lang = new helpers.LanguageHandler({
    "Key 1": "Phrase 1",
    "Key 2": "Message 2 is here"
}) // Creates default localization file in './locales/lang_en.json'
```

### (De)Initializing additional languages
`LanguageHandler.registerLanguage(locale: string, messages: {})` provides method for instantiating new localization
<br><span style="color:#009988">TypeScript</span> | <span style="color:#ffff00">JavaScript</span> example
```js
lang.registerLanguage('ru', {
    "Key 1": "Это локализованное сообщение 1 на русском языке",
    "Key 2": "Это локализованное сообщение 2 на русском языке"
}) // Creates file './locales/lang_ru.json' with russian localization
```
`LanguageHandler.unregisterLanguage(locale: string)` could help you if you want to delete language file during runtime of the application
<br><span style="color:#009988">TypeScript</span> | <span style="color:#ffff00">JavaScript</span> example
```js
lang.unregisterLanguage('ru') // Deletes file './locales/lang_ru.json' with russian localization and destroys russian localization in memory
```

### Getting and setting server localization preference
You can always get server language using `LanguageHandler.getServerLanguage(id: string)` method:
<br><span style="color:#009988">TypeScript</span> | <span style="color:#ffff00">JavaScript</span> example
```js
lang.getServerLanguage('12345') // Returns localization literal, for example - 'en'
```
As well as you can change this language into something different using `LanguageHandler.setServerLanguage(id: string, locale: string)` method:
<br><span style="color:#009988">TypeScript</span> | <span style="color:#ffff00">JavaScript</span> example
```js
lang.setServerLanguage('12345', 'ru') // Sets russian localization preference for server with id '12345'
```

### Getting localized messages
API provides automatically localized messages (considering localization file exists) with `LanguageHandler.getMessage(id: string, key: string)` method:
<br><span style="color:#009988">TypeScript</span> | <span style="color:#ffff00">JavaScript</span> example
```js
lang.getMessage('12345', 'Key 1') // Returns "Это локализованное сообщение 1 на русском языке", since we have set 'ru' localization for server '12345' in previous steps
```

## Handling commands
`CommandHandler` class is the thing, when you need to have a quick and reliable way to implement user commands
### Initialization
As always, you need to create new instance:
<br><span style="color:#009988">TypeScript</span> example
```ts
import * as helpers from 'discord-bot-helpers'

const cmd = new helpers.CommandHandler(); // Default prefix is '/'
```

<br><span style="color:#ffff00">JavaScript</span> example
```js
const helpers = require('discord-bot-helpers')

const cmd = new helpers.CommandHandler('!') // Will set default command prefix to '!'
```

### (Un)Registering commands
*Registering command* means that you are assigning callback for specific message entry
<br><span style="color:#009988">TypeScript</span> | <span style="color:#ffff00">JavaScript</span> example
```js
const success = cmd.registerCommand('help', helpers.CommandType.console, cmdHelp)

function cmdHelp() {
    console.log('Help yourself!')
}

if (success) {
    console.log('Command was registered successfully!')
}
else {
    console.log('Something went wrong 🤔')
}
```
*Unregistering command* means making this command unavailable and unassigning it's callback
<br><span style="color:#009988">TypeScript</span> | <span style="color:#ffff00">JavaScript</span> example
```js
const success = cmd.unregisterCommand('help')

if (success) {
    console.log('Command was unregistered successfully!')
}
else {
    console.log('Something went wrong 🤔')
}
```

### Handling inputs
#### Handling console input
Current API provides special type of command for console input handling, following code will give you an example on how to do that

<br><span style="color:#009988">TypeScript</span> example
```ts
import * as helpers from 'discord-bot-helpers'

const cmd = new helpers.CommandHandler();

function concmdOutputArgs(args: string[]) {
    if (args.length > 0) {
        console.log(`I've received the following arguments:\n${args}`)
    }
    else {
        console.log(`I haven't received any arguments :(`)
    }
}

cmd.registerCommand('out', helpers.CommandType.console, concmdOutputArgs);

process.stdin.setEncoding('utf-8')

process.stdin.on('data', data => cmd.handleConsoleMessage(data))
```
<span style="color:#ffff00">JavaScript</span> example
```js
const helpers = require('discord-bot-helpers')

const cmd = new helpers.CommandHandler('!')

function pong() {
    console.log(`pong`)
}

cmd.registerCommand('ping', helpers.CommandType.console, pong);

process.stdin.setEncoding('utf-8')

process.stdin.on('data', data => cmd.handleConsoleMessage(data))
```

#### Handling discord messages
You also can rely on the library in terms of controlling discord messages and fire commands if they match
<br><span style="color:#009988">TypeScript</span> example
```ts
import * as helpers from 'discord-bot-helpers'
import * as discord from 'discord.js'

const cmd = new helpers.CommandHandler();
const client = new discord.Client();

client.on('message', msg => cmd.handleDiscordMessage(msg))
client.login('YOUR_COOL_TOKEN_HERE')

cmd.registerCommand('lol', helpers.CommandType.shared, cmdLol)
cmd.registerCommand('lul', helpers.CommandType.PM, cmdLul)
cmd.registerCommand('lal', helpers.CommandType.shared, cmdLal)


function cmdLol(message: discord.Message) {
    let server = message.guild // Here you can rely on the API, server won't be null since we assigned type 'server' to command
    message.channel.send('Some random string')
}

function cmdLul(message:discord.Message, args: string[]) {
    let server = message.guild // Will always be null, because this command can only be called in PM
    message.reply(`You've provided arguments: ${args}`)
}

function cmdLal(message:discord.Message) {
    let server = message.guild // Can be null, needs checking, since type is 'shared'
}
```

#### Recomendations and guidelines
* Best practice is to use specific type for discord commands (instead of 'shared')
* Every type of command can receive `string[]` as arguments array, it cannot be null or undefined, but can have `length == 0`
* TypeScript is recommended while developing discord bots, since it can be more precise in checking errors than JavaScript. Bug possibility is *way lower*

## Roadmap
- [x] Logging
- [x] Language handling
- [x] Command handling
- [ ] Migrating to async filesystem operations and async API methods for command handling
- [ ] Improving language handler with new helper methods, such as getting available localizations, validating localization object, appending new entries to the localization file without overwriting it
- [ ] Advanced command parsing with single quotation marks and arrays (not sure if needed)
- [ ] Auto permission handling 

## Credits
* General idea and structure (partially) of language handler was inspired by Oxide/uMod modding platform, `Lang library` from `Oxide.Core.dll` licensed under the [MIT license][license]
* Parsing arguments function was originally taken from `Oxide.Core.dll` and adopted for TypeScript
* All dependencies belong to their developer teams, and keep original licenses

## Links
* [Github]
* [NPMJS]
* [Discord]
