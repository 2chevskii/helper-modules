## Discord bot helpers
**Compilation of functions to help writing discord bots**
<br>*Package could be used with TypeScript as well as with pure JavaScript*
<hr>

- [Discord bot helpers](#discord-bot-helpers)
- [Logger](#logger)
- [Command handler | ***WIP***](#command-handler--wip)
- [Roadmap](#roadmap)

<hr>

## Logger
*This class allows you to add log output to your application with just few lines of code*
> Features
* Log to console (`with or without timestamp`)
* Log to file (`with or without timestamp, additional log to console`)
* Get separate timestamp
> Exports
```ts
Log(data: any, timestamp?: boolean): void;
LogToFile(data: any, timestamp?: boolean, toConsole?: boolean): void;
GetTimestamp(withDate?: boolean): string;
```
> <span style="color: #2ca88f">TypeScript</span> example
```ts
import help from 'discord-bot-helpers'

const logger = new help.Logger('./debug.log')

logger.Log('This is a console log!', false /*without timestamp*/)
logger.LogToFile('This is a text file log!', true /*with timestamp*/, false /*without console output*/)
console.log(logger.GetTimestamp()) //and this is just a timestamp [hh:mm:ss]
```
> <span style="color: yellow">JavaScript</span> example

## Command handler | ***WIP***
*This class allows you to easily process chat or console messages*

## Roadmap
- [x] Logger
- [x] Logger tests
- [x] Basic command handling
- [ ] Basic command handling tests
- [ ] Advanced command handling
- [ ] Command handler docs