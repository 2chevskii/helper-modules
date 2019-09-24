[npmjs]: https://www.npmjs.com/package/helper-modules
[github]: https://github.com/2chevskii/helper-modules
[license]: https://www.tldrlegal.com/l/mit
[discord]: https://discord.gg/DBaqZNZ
[docs]: https://2chevskii.github.io/helper-modules/

![](logo.png)

[![npmjs](https://img.shields.io/npm/v/helper-modules)][npmjs] [![license](https://img.shields.io/github/license/2chevskii/discord-bot-helpers)][license] [![github](https://img.shields.io/github/last-commit/2chevskii/discord-bot-helpers?style=flat)][github] [![Codacy Badge](https://api.codacy.com/project/badge/Grade/32c8a11241b646e6bc5ecd2803853e51)](https://www.codacy.com/manual/2chevskii/helper-modules?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=2chevskii/helper-modules&amp;utm_campaign=Badge_Grade) [![discord](https://discordapp.com/api/guilds/266961601784053781/embed.png)][discord]

> Library for handling various things like commands, localization, logging etc.

## Contents

- [Contents](#contents)
- [Installation](#installation)
- [Features](#features)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Credits](#credits)
- [Links](#links)

## Installation

- To install the package simply run:
  - `npm i helper-modules`
- If you are installing from the repo, you'd probably need to install dependencies:
  - `npm i`
- To build module files, use build script:
  - `npm run build`

## Features

- [x] Logging actions and info with `Log` module
- [x] Bot localization on different servers with `Lang` module
- [x] Bot command handling with `Command` module
- [ ] Generating flexible config file with `Config` module

> Some of the library features use asynchronous functions, be sure to handle them properly with `then()/catch()` or `async/await`

> This library is highly WIP, things might change throughout the time<br>

> Latest buildable version of package will always be located in 'develop' branch, 'master' is for stable and fully tested versions

## Documentation and examples

Autogenerated documentation for this project is [located here][docs]

### Importing module

> TypeScript
```ts
import * as helpers from 'helper-modules'
```
> JavaScript (ES6 modules)
```js
import helpers from 'helper-modules'
```
> JavaScript (CommonJS)
```js
const helpers = require('helper-modules')
```

### Log handling

Log module (namespace) is used for logging errors, warnings and any other additional information on demand. 

> [Module definitions](https://2chevskii.github.io/helper-modules/modules/_log_module_.html)

#### Writing log messages

```js
const log = helpers.Log

log.log('This is a simple log message')
log.logError('This message will appear red in console and will have [ERROR] prefix in the log file')
log.logWarning('Yellow message with [WARNING] prefix')

log.logToFile('Something important that you want to log into separate file', './path-to-the-file')
.then(() => log.log('This will not appear in the log file', true, true, false))
.catch(() => log.logError('And this will not appear in the console, neither will have a timestamp', false, false))
```

#### Getting last log messages

```js

```

#### Setting new prefix for the log file

```js
const reserved = log.Utility.reservedCharacters // these chars cannot be located in the logfile prefix
log.setPrefix('newprefix') // now the default log file will be named as 'newprefix_day_month_year.log'
```

#### Getting current time

```js
const currentTime = new log.Utility.TimeStamp()
var currentTimeString = currentTime.toString() // returns '[hour:minute:second]'
currentTimeString = log.Utility.TimeStamp.toString(currentTime) // same result, but through static method
```

## Roadmap

- [x] Logging
- [x] Language handling
- [x] Command handling
- [x] Migrating to async filesystem operations and async API methods for command handling
- [x] Improving language handler with new helper methods, such as getting available localizations, validating localization object, appending new entries to the localization file without overwriting it
- [ ] Advanced command parsing with single quotation marks and arrays (not sure if needed)
- [ ] ~~Auto permission handling~~ (refused) 

## Credits

* General idea and structure (partially) of this library was inspired by Oxide/uMod modding platform, code from `Oxide.Core.dll` licensed under the [MIT license][license]
* All dependencies belong to their developer teams, and keep original licenses

## Links

* [Github]
* [NPMJS]
* [Discord]
* [MIT LICENSE][license]
* [Documentation][docs]

## Community

![](https://discordapp.com/api/guilds/266961601784053781/embed.png?style=banner3)