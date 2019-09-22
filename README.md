[npmjs]: https://www.npmjs.com/package/helper-modules
[github]: https://github.com/2chevskii/helper-modules
[license]: https://www.tldrlegal.com/l/mit
[discord]: https://discord.gg/DBaqZNZ

## <div style="text-align:center; font-style:bold; color:yellow">HELPER MODULES <hr> [![npmjs](https://img.shields.io/npm/v/helper-modules)][npmjs] [![license](https://img.shields.io/github/license/2chevskii/discord-bot-helpers)][license] [![discord](https://discordapp.com/api/guilds/266961601784053781/embed.png)][discord] ![](https://img.shields.io/github/last-commit/2chevskii/discord-bot-helpers?style=flat) <hr> </div>

> Library for handling various things like commands, localization, logging etc.

## Installation

- To install the package simply run:<br>
  - `npm i helper-modules`<br>
- If you are installing from the repo, you'd probably need to install dependencies:<br>
  - `npm i`<br>
- To build module files, use build script:<br>
  - `npm run build`

## Features

- [x] Easy logging actions with `Log` module
- [x] Easy localizing bot on different servers with `Lang` module
- [x] Easy processing commands with `Command` module

> Some of the library features use asynchronous functions, be sure to handle them properly with `then()/catch()` or `async/await`

> This library is highly WIP, things might change throughout the time<br>

> Latest buildable version of package will always be located in 'develop' branch, 'master' is for stable and fully tested versions


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