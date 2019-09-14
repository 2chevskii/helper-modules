import * as fs from 'fs'
import Log from './log'

//import {loadConfiguration, configuration} from './index'

/**
 * Contains definitions which can be useful for creating dynamic configuration for you application.
 */
export namespace Config {
    /**
     * Searchpath for configuration file.
     */
    const configpath = './config.json'

    /**
     * Initializing logger to deal with possible exceptions.
     */
    const logger = new Log.LogHandler('config-module')

    /**
     * This type helps with getting bot-hoster-defined values from json configuration file.
     */
    export class ConfigHandler {
        /**
         * Config object itself, which contains properties with values.
         */
        private config: Object

        /**
         * Initializes new ConfigHandler object.
         * @param {Object} defaultconfig Object which contains default values for configuration.
         */
        constructor(defaultconfig: Object = {}) {
            this.config = defaultconfig
            this.loadConfig()
        }

        /**
         * Tries to load configuration from the file.
         */
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

        /**
         * Get value of the configuration property or set default value for this property.
         * @param {string | number} key Configuration key.
         * @param {any} defaultvalue Configuartion will be updated with this value for the given key if it does not exists.
         * @returns {any} Value of the property.
         */
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

        /**
         * Tells if the property exists in the configuration.
         * @param prop Name of the property.
         * @returns {boolean} Property exists or not.
         */
        hasProperty(prop: string | number): boolean {
            return this.config.hasOwnProperty(prop)
        }

        /**
         * Allows you to add new property to the config, or update the old one with new value forcefully.
         * @param {string | number} prop Property name.
         * @param {any} defaultvalue Default value of the property.
         * @param {boolean} alterIfExist Whether module should update the property if it does already exist.
         * @returns {boolean} Success or failure
         */
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

        /**
         * Deletes the property from the configuration
         * @param {string | number} prop 
         * @returns {boolean} Success or failure
         */
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

        /**
         * Returns an array of all property names existing in the configuration
         * @returns {string[]} Array of the config keys
         */
        allProperties() {
            return Object.keys(this.config).filter(prop => {
                return this.config[prop] != undefined
            })
        }
    }
}

export default Config;