export * from './lang'
export * from './command'
export * from './log'
export * from './config'

// import * as fs from 'fs'

// export var configuration = {
//     logs_folder: './logs',
//     locales_folder: './locales',
//     lang_data_path: './lang-module.json',
//     config_path: './config-modulejson',
//     commands_data_path: './command-module.json'
// }

// const configurationpath = './helpers-module-config.json'

// export const loadConfiguration = () => {
//     if (!fs.existsSync(configurationpath)) {
//         fs.writeFileSync(configurationpath, JSON.stringify(configuration, null, '\t'))
//     }

//     const json = fs.readFileSync(configurationpath, {encoding: 'utf-8', flag: 'r'})
//     try {
//         configuration = JSON.parse(json)
//     } catch (ex) {
//         fs.unlinkSync(configurationpath)
//         loadConfiguration()
//     }
// }