import * as fs from 'fs'
import Log from './log'

/* TODO:
 * Document this module
 */

export namespace Config {
    const configpath = './config.json'
    const logger = new Log.LogHandler('config-module')


    export class ConfigHandler {
        private config: Object
        constructor(defaultconfig: Object = {}) {
            this.config = defaultconfig
            this.loadConfig()
        }

        loadConfig() {
            const exists = fs.existsSync(configpath)

            if (!exists) {
                fs.writeFileSync(configpath, JSON.stringify(this.config, null, '\t'))
            }

            try {
                var readconfig = JSON.parse(fs.readFileSync(configpath, { encoding: 'utf-8', flag: 'r' }))
                Object.keys(readconfig).forEach(prop => {
                    if (this.config.hasOwnProperty(prop) && prop != undefined) {
                        this.config[prop] = readconfig[prop]
                    }
                })
            } catch (error) {
                logger.writeLogFile(error)
            }
            fs.writeFile(configpath, JSON.stringify(this.config, null, '\t'), (ex) => {
                if (ex != null) {
                    logger.writeLogFile(ex)
                }
            })
        }

        getConfig(key: string | number, defaultvalue: any = null) {
            if (this.config[key] != undefined) {
                return this.config[key]
            }
            else if (defaultvalue != undefined && defaultvalue != null) {
                this.config[key] = defaultvalue
                fs.writeFile(configpath, JSON.stringify(this.config, null, '\t'), (ex) => {
                    if (ex != null) {
                        logger.writeLogFile(ex)
                    }
                })
                return defaultvalue;
            }
        }

        hasProperty(prop: string | number): boolean {
            return this.config.hasOwnProperty(prop)
        }

        addProperty(prop: string | number, defaultvalue: any, alterIfExist: boolean = false): boolean {
            const has = this.hasProperty(prop)
            if (has && !alterIfExist) {
                return false;
            }

            this.config[prop] = defaultvalue
            fs.writeFile(configpath, JSON.stringify(this.config, null, '\t'), err => {
                if (err != null) {
                    logger.writeLogFile(err)
                }
            })
            return true;
        }

        removeProperty(prop: string | number): boolean {
            const has = this.hasProperty(prop)
            if (!has) {
                return false;
            }
            const success = delete this.config[prop]
            if (success) {
                fs.writeFile(configpath, JSON.stringify(this.config, null, '\t'), err => logger.writeLogFile(err))
            }
            return success;
        }

        allProperties() {
            return Object.keys(this.config).filter(prop => {
                return this.config[prop] != undefined
            })
        }
    }
}

export default Config;