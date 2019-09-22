import fs from 'fs'
import { Log } from './log-module'
import path from 'path'

/**
 * @namespace Lang
 */
export namespace Lang {

    /**
     * @type {string}
     * @constant
     * @memberof Lang
     */
    const langfolder = `.${path.sep}helper-modules${path.sep}locales`

    /**
     * @type {string}
     * @constant
     * @memberof Lang
     */
    const langdatafile = `.${path.sep}helper-modules${path.sep}lang-module.json`

    /**
     * Get localized message depending on given `id`.
     * @function
     * @export
     * @param {string} id Id of the user or server to get appropriate message localization
     * @param {string} key Key of the phrase' key-value pair
     * @returns {string} Value of the phrase' key-value pair
     * @memberof Lang
     */
    export function getMessage(id: string, key: string): string {
        return LangInternal.Instance.getMessage(id, key)
    }


    /**
     * Add new language (or update existing).
     * @function
     * @export
     * @param messages Dictionary with messages ([string,string][]). If the language already exists, it will be updated with missing *keys*, existing ones will be kept unchanged
     * @param {string} [lang='en'] Locale string
     * @returns {boolean} Returns true if language is registered successfully, or false, if localization literal contains restricted characters (Listed in `Log.Utility.reservedCharacters`)
     * @memberof Lang
     */
    export function registerLanguage(messages: Array<[string, string]>, lang: string = 'en'): boolean {
        Log.Utility.reservedCharacters.forEach(char => {
            if (lang.includes(char)) {
                return false;
            }
        });
        LangInternal.Instance.registerLanguage(lang, messages)
        return true
    }

    /**
     * Whether given message exists in chosen language or not.
     * @function
     * @export
     * @param {string} lang Language literal
     * @param {string} key Phrase key
     * @returns {boolean} Message exists or not
     * @memberof Lang
     */
    export function hasMessage(lang: string, key: string): boolean {
        return LangInternal.Instance.hasMessage(lang, key)
    }

    /**
     * Returns all messages for chosen language.
     * @function
     * @export
     * @param {string} lang Language literal
     * @returns {object[]} Message disctionary (Array<[string, string]>). May contain 0 entries, but never undefined
     * @memberof Lang
     */
    export function getLanguageMessages(lang: string): Array<[string, string]> {
        return LangInternal.Instance.getLanguageMessages(lang)
    }

    /**
     * Get all language literals.
     * @function
     * @export
     * @returns {string[]} Literal array
     * @memberof Lang
     */
    export function getAvailableLanguages(): string[] {
        return LangInternal.Instance.getAvailableLanguages()
    }

    /**
     * Get language for specific user/server id.
     * @function
     * @export
     * @param {string} id Id which you want to get information for
     * @returns {string} Localization string (default, if data does not exist)
     * @memberof Lang
     */
    export function getLanguage(id: string): string {
        return LangInternal.Instance.getLanguage(id)
    }

    /**
     * Set new language for given id.
     * @function
     * @export
     * @param {string} id Chosen user/server id
     * @param {string} lang New language
     * @memberof Lang
     */
    export function setLanguage(id: string, lang: string): void {
        return LangInternal.Instance.setLanguage(id, lang)
    }

    /**
     * Object which contains data for one user/server.
     * @interface ILangData
     * @memberof Lang
     */
    interface ILangData {
        id: string
        locale: string
    }

    /**
     * Object which contains language data for one literal ('en'/'de' etc.).
     * @interface ILanguage
     * @memberof Lang
     */
    interface ILanguage {
        locale: string
        messages: Array<[string, string]>
    }

    /**
     * Internal class to hide certain methods.
     * @class LangInternal
     * @memberof Lang
     */
    class LangInternal {
        private data: Array<ILangData>
        private languages: Array<ILanguage>
        private static _instance: LangInternal

        /**
         * Creates an instance of LangInternal.
         * @public
         * @constructor
         * @memberof Lang.LangInternal
         */
        public constructor() {
            this.data = new Array<ILangData>()
            this.languages = new Array<ILanguage>()
            this.fetchLangFiles()
            this.loadData()
        }

        /**
         * Returns message for given user/server id.
         * @public
         * @method
         * @param {string} id Chosen user/server id.
         * @param {string} msg Message key.
         * @returns {string} Localized phrase.
         * @memberof Lang.LangInternal
         */
        public getMessage(id: string, msg: string): string {
            var locale = getLanguage(id)
            return this.getMessageInternal(locale, msg)
        }

        /**
         * Add new language or update existing.
         * @public
         * @method
         * @param {string} locale Localization literal.
         * @param messages Localization dictionary (Array<[string, string]>).
         * @memberof Lang.LangInternal
         */
        public registerLanguage(locale: string, messages: Array<[string, string]>) {
            var lang = this.languages.find(lang => lang.locale === locale)
            if (lang !== undefined) {
                for (let msg of messages) {
                    var phrase = lang.messages.find(p => p[0] == msg[0])
                    if (phrase === undefined) {
                        lang.messages.push(msg)
                    }
                }
            }
            else {
                lang = {
                    locale: locale,
                    messages: messages
                }
                this.languages.push(lang)
            }
            this.saveLangFile(locale)
        }

        /**
         * Whether message exists in the chosen language or not.
         * @public
         * @method
         * @param {string} locale Localization string.
         * @param {string} message Localization message key.
         * @returns {boolean} Whether message exists in the chosen language or not.
         * @memberof Lang.LangInternal
         */
        public hasMessage(locale: string, message: string) {
            var lang = this.languages.find(lang => lang.locale === locale)
            if (lang !== undefined) {
                lang.messages.forEach(msg => {
                    if (msg[0] === message) {
                        return true
                    }
                })
            }
            return false;
        }

        /**
         * Get all messages of the chosen language.
         * @public
         * @method
         * @param {string} locale Localization string.
         * @returns {object[]} Language messages (Array<[string, string]>).
         * @memberof Lang.LangInternal
         */
        public getLanguageMessages(locale: string): Array<[string, string]> {
            var messages = new Array<[string, string]>()
            var data = this.languages.find(lang => lang.locale === locale)
            if (data !== undefined) {
                data.messages.forEach(phrase => {
                    messages.push(phrase)
                })
            }
            return messages
        }

        /**
         * Get all language strings.
         * @public
         * @method
         * @returns {string[]} Array with localization strings.
         * @memberof Lang.LangInternal
         */
        public getAvailableLanguages(): string[] {
            return this.languages.map(lang => lang.locale)
        }

        /**
         * Get language for chosen id.
         * @public
         * @method
         * @param {string} id User/server id.
         * @returns {string} Localization string.
         * @memberof Lang.LangInternal
         */
        public getLanguage(id: string): string {
            var data = this.data.find(data => data.id === id)
            if (data === undefined) {
                data = {
                    id: id,
                    locale: 'en'
                }
                this.data.push(data)
                setImmediate(() => fs.writeFileSync(langdatafile, JSON.stringify(this.data)))
            }
            return data.locale
        }

        /**
         * Sets new language for given id.
         * @public
         * @method
         * @param {string} id User/server id.
         * @param {string} locale New localization string.
         * @memberof Lang.LangInternal
         */
        public setLanguage(id: string, locale: string): void {
            var data = this.data.find(data => data.id === id)
            if (data === undefined) {
                data = {
                    id: id,
                    locale: locale
                }
                this.data.push(data)
            }
            else {
                data.locale = locale
            }
            setImmediate(() => fs.writeFileSync(langdatafile, JSON.stringify(this.data)))
        }

        /**
         * Internal method to retrieve message for appropriate localization.
         * @method
         * @private
         * @param {string} locale Localization literal.
         * @param {string} msg Message key.
         * @returns {string} Localized message or key, if localization does not exist.
         * @memberof Lang.LangInternal
         */
        private getMessageInternal(locale: string, msg: string): string {
            if (this.languages.length < 1) {
                Log.logWarning('App is trying to use language module, but no languages are registered!')
                return msg
            }
            var lang = this.languages.find(lang => lang.locale === locale)
            if (lang === undefined) {
                lang = this.languages[0]
            }

            var message = lang.messages.find(mes => mes[0] === msg)

            if (message === undefined) {
                return msg
            }

            return message[1]
        }

        /**
         * Get path to the appropriate language file.
         * @method
         * @private
         * @param {string} locale Localization literal.
         * @returns {string} Path to the localization file.
         * @memberof Lang.LangInternal
         */
        private getPath(locale: string): string {
            return path.join(langfolder, `lang_${locale}.json`)
        }

        /**
         * Load language data.
         * @method
         * @private
         * @memberof Lang.LangInternal
         */
        private loadData(): void {
            if (!fs.existsSync(langdatafile)) {
                fs.writeFileSync(langdatafile, JSON.stringify(this.data))
            }
            try {
                this.data = JSON.parse(fs.readFileSync(langdatafile, { encoding: 'utf-8', flag: 'r' }))
                if (this.data === undefined) {
                    throw 'Data was not loaded correctly, it will be reset'
                }
            } catch (ex) {
                Log.logError(`[LANG] ${ex}`)
                fs.unlinkSync(langdatafile)
                this.loadData()
            }
        }

        /**
         * Load language files from the localization folder.
         * @method
         * @private
         * @memberof Lang.LangInternal
         */
        private fetchLangFiles(): void {
            if (!fs.existsSync(langfolder)) {
                fs.mkdirSync(langfolder, { recursive: true })
            }
            for (let file of fs.readdirSync(langfolder)) {
                if (file.startsWith('lang_') && file.endsWith('.json')) {
                    try {
                        let locale = file.replace('lang_', '').replace('.json', '')
                        let strings = JSON.parse(fs.readFileSync(this.getPath(locale), { encoding: 'utf-8', flag: 'r' }))
                        var lang = this.languages.find(lang => lang.locale === locale)
                        if (lang !== undefined) {
                            this.languages = this.languages.filter(lang => lang.locale !== locale)
                        }
                        lang = {
                            locale: locale,
                            messages: strings
                        }
                        this.languages.push(lang)
                    } catch (ex) {
                        Log.logError(`[LANG] ${ex}`)
                    }
                }
            }
        }

        /**
         * Save language to the chosen file.
         * @method
         * @private
         * @param {string} locale
         * @memberof Lang.LangInternal
         */
        private saveLangFile(locale: string): void {
            if (!fs.existsSync(langfolder)) {
                fs.mkdirSync(langfolder, { recursive: true })
            }

            var lang = this.languages.find(lang => lang.locale === locale)

            if (lang !== undefined) {
                fs.writeFile(this.getPath(lang.locale), JSON.stringify(lang.messages, null, '\t'), ex => {
                    if (ex != null) {
                        Log.logError(ex)
                    }
                })
            }
        }

        /**
         * Ensure that the LangInternal object exists before accessing it.
         * @public
         * @readonly
         * @static
         * @property
         * @returns {LangInternal}
         * @memberof Lang.LangInternal
         */
        public static get Instance(): LangInternal {
            if (LangInternal._instance === undefined) {
                LangInternal._instance = new LangInternal()
            }
            return LangInternal._instance
        }
    }
}

export default Lang