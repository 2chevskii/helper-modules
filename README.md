[npmjs]: https://www.npmjs.com/package/discord-bot-helpers
[github]: https://github.com/2chevskii/discord-bot-helpers

## Discord bot helpers [![npmjs](https://img.shields.io/npm/v/discord-bot-helpers)][npmjs] [![github](https://img.shields.io/github/license/2chevskii/discord-bot-helpers)][github]
> Provides various helpers to make writing discord bots easier

## Contents

[Installation](#installation)

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

## Logging
`LogHandler` class is intended to be used as logger.

### Initializing
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