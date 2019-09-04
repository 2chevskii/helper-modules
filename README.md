[npmjs]: https://www.npmjs.com/package/discord-bot-helpers
[github]: https://github.com/2chevskii/discord-bot-helpers

## Discord bot helpers [![npmjs](https://img.shields.io/npm/v/discord-bot-helpers)][npmjs] [![github](https://img.shields.io/github/license/2chevskii/discord-bot-helpers)][github]
> Provides various helpers to make writing discord bots easier

## Contents

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
- [Roadmap](#roadmap)
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

> Also don't forget that this library is highly WIP, things might change throughout the time

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

## Roadmap
- [x] Logging
- [x] Language handling
- [x] Command handling
- [ ] Migrating to async filesystem operations and async API methods for command handling
- [ ] Improving language handler with new helper methods, such as getting available localizations, validating localization object, appending new entries to the localization file without overwriting it
- [ ] Advanced command parsing with single quotation marks and arrays (not sure if needed)

## Pages
* [Github]
* [NPMJS]