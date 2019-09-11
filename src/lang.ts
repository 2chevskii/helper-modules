import * as fs from 'fs'
import path from 'path'
import { Log } from './log'

/**
 * Contains definitions which could help you to create multilanguage bot.
 */
export namespace Lang {
    // These values are not intended to be modified, do that only if you really know what you are doing.
    /** 
     * Path to the localization folder.
     */
    const localesfolder = './locales'

    /**
     * Initializing logger to deal with errors.
     */
    const logger = new Log.LogHandler('lang-module')

    /**
     * This module helps localize messages individually for servers and/or users.
     */
    export class LanguageHandler {
        /**
         * Contains message data.
         */
        private languages: Array<{}>
        /**
         * Contains preferences for different servers and/or users.
         */
        private langdata: Object

        /**
         * Initializes new LanguageHandler object
         */
        constructor() {
            this.languages = new Array<{}>()
            this.langdata = {}
            this.loadLanguageFiles()
            this.loadLangData()
        }

        /**
         * Loads language preferences.
         */
        private loadLangData() {
            if (!fs.existsSync('./lang_data.json')) {
                this.saveLangData();
            }
            try {
                this.langdata = JSON.parse(fs.readFileSync('./lang_data.json', { encoding: 'utf-8', flag: 'r' }))
                if (this.langdata == undefined || this.langdata == null) {
                    throw 'Error while reading language data';
                }
            } catch (error) {
                logger.writeLogFile(error)
                this.langdata = {}
                this.saveLangData()
            }
        }

        /**
         * Saves preferences data.
         */
        private saveLangData() {
            fs.writeFileSync('./lang_data.json', JSON.stringify(this.langdata, null, '\t'))
        }

        /**
         * Loads languages from localization files.
         */
        private loadLanguageFiles() {
            if (!fs.existsSync(localesfolder)) {
                fs.mkdirSync(localesfolder)
            }

            for (let file of fs.readdirSync(localesfolder)) {
                if (file.startsWith('lang_') && file.endsWith('.json')) {
                    try {
                        let locale = file.replace('lang_', '').replace('.json', '')
                        let strings = JSON.parse(fs.readFileSync(this.getPath(locale), { encoding: 'utf-8', flag: 'r' }))
                        this.languages[locale] = strings
                    } catch (ex) {
                        logger.writeLogFile(ex)
                    }
                }
            }
        }

        /**
         * Saves languages data into localization files.
         */
        private saveLanguageFiles() {
            if (!fs.existsSync(localesfolder)) {
                fs.mkdirSync(localesfolder)
            }

            Object.entries(this.languages).forEach(value => {
                fs.writeFile(this.getPath(value[0]), JSON.stringify(value[1], null, '\t'), null, ex => {
                    if (ex != null) {
                        logger.writeLogFile(ex)
                    }
                })
            });
        }

        /**
         * Returns localization literal appropriate for given id.
         * @param {string} id Server or user id, whose language literal you want to get.
         * @returns {string} `locale` - literal language representation (for ex.: `en` - for English language).
         */
        getLanguage(id: string) {
            if (this.langdata[id] == undefined) {

                this.langdata[id] = Object.keys(this.languages)[0]
                this.saveLangData()
            }
            return this.langdata[id]
        }

        /**
         * Returns and array of all language literals, registered at the moment.
         * @returns {string[]} Array of registered languages.
         */
        getAllLanguages() {
            return Object.keys(this.languages)
        }

        /**
         * Returns all registered *message keys* for the given language.
         * @param locale Language which messages you want to get.
         * @returns {string[]} Array of message keys.
         */
        getAllLanguageMessages(locale: string) {
            return Object.keys(this.languages[locale])
        }

        /**
         * Creates (or updates) language file and language itself. If the language exists - it will update it only if the given object does include keys which existing language does not, it will append them, no data will be lost.
         * @param locale Language literal.
         * @param messages Object with messages.
         */
        registerLanguage(locale: string, messages: {}) {
            if (!this.existsLanguage(locale)) {
                this.languages[locale] = messages
            }
            else {
                for (let msg of Object.keys(messages)) {
                    if (this.languages[locale][msg] == undefined) {
                        this.languages[locale][msg] = messages[msg]
                    }
                }
            }
            this.saveLanguageFiles();
        }

        /**
         * Updates language preferences for the given server/user.
         * @param id Server or user id.
         * @param locale New language.
         */
        setLanguage(id: string, locale: string) {
            this.langdata[id] = locale
            this.saveLangData()
        }

        /**
         * Returns localized message for the given id. Will return key if message does not exist. 
         * @param id Server or user id.
         * @param key Message key.
         * @returns {string} Message
         */
        getMessage(id: string, key: string) {
            return this.getMessageInternal(this.getLanguage(id), key)
        }

        /**
         * Returns localized message for the given locale string. Will return key if message does not exist.
         * @param locale Localization.
         * @param key Message key.
         * @returns {string} Message
         */
        private getMessageInternal(locale: string, key: string) {
            if (!this.existsMessage(locale, key)) {
                return key;
            }
            else {
                return this.languages[locale][key]
            }
        }

        /**
         * Returns boolean value corresponding to whether given message exists in the registered language or not.
         * @param locale Localization.
         * @param key Message.
         * @returns {boolean} Value which means if the message exists.
         */
        existsMessage(locale: string, key: string) {
            if (!this.existsLanguage(locale)) {
                return false;
            }
            return this.languages[locale][key] != undefined
        }

        /**
         * Tells whether given language is registered or not.
         * @param locale Choosen language.
         * @returns {boolean} Given language exists or not.
         */
        existsLanguage(locale: string) {
            return this.languages[locale] != undefined
        }

        /**
         * Quick way to get path to the language file depending on given localization string.
         * @param locale Localization literal.
         * @returns {string} Generated path.
         */
        private getPath(locale: string) {
            return path.join(localesfolder, `lang_${locale}.json`)
        }
    }
}

export default Lang