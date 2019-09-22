import fs from 'fs'
import { Log } from './log-module'
import path from 'path'

export namespace Lang {

    const langfolder = `.${path.sep}helper-modules${path.sep}locales`

    const langdatafile = `.${path.sep}helper-modules${path.sep}lang-module.json`

    /**
     * Get localized message depending on given `id`.
     *
     * @export
     * @param {string} id Id of the user or server to get appropriate message localization.
     * @param {string} key Key of the phrase' key-value pair.
     * @returns {string} Value of the phrase' key-value pair.
     */
    export function getMessage(id: string, key: string): string {
        return LangInternal.Instance.getMessage(id, key)
    }


    /**
     * Add new language (or update existing).
     *
     * @export
     * @param messages Dictionary with messages ([string,string][]). If the language already exists, it will be updated with missing *keys*, existing ones will be kept unchanged.
     * @param {string} [lang='en'] Locale string.
     * @returns {boolean} Returns true if language is registered successfully, or false, if localization literal contains restricted characters (Listed in `Log.Utility.reservedCharacters`)
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
     *
     * @export
     * @param {string} lang Language literal.
     * @param {string} key Phrase key.
     * @returns {boolean} Message exists or not.
     */
    export function hasMessage(lang: string, key: string): boolean {
        return LangInternal.Instance.hasMessage(lang, key)
    }

    /**
     * Returns all messages for chosen language.
     *
     * @export
     * @param {string} lang Language literal.
     * @returns Message disctionary (Array<[string, string]>). May contain 0 entries, but never undefined.
     */
    export function getLanguageMessages(lang: string): Array<[string, string]> {
        return LangInternal.Instance.getLanguageMessages(lang)
    }

    /**
     * Get all language literals.
     *
     * @export
     * @returns {string[]} Literal array.
     */
    export function getAvailableLanguages(): string[] {
        return LangInternal.Instance.getAvailableLanguages()
    }

    /**
     * Get language for specific user/server id.
     *
     * @export
     * @param {string} id Id which you want to get information for.
     * @returns {string} Localization string (default, if data does not exist).
     */
    export function getLanguage(id: string): string {
        return LangInternal.Instance.getLanguage(id)
    }

    /**
     * Set new language for given id.
     *
     * @export
     * @param {string} id Chosen user/server id.
     * @param {string} lang New language.
     * @returns {void}
     */
    export function setLanguage(id: string, lang: string): void {
        return LangInternal.Instance.setLanguage(id, lang)
    }

    /**
     * Object which contains data for one user/server.
     *
     * @interface ILangData
     */
    interface ILangData {
        id: string
        locale: string
    }

    /**
     * Object which contains language data for one literal ('en'/'de' etc.).
     *
     * @interface ILanguage
     */
    interface ILanguage {
        locale: string
        messages: Array<[string, string]>
    }

    /**
     * Internal class to hide certain methods.
     *
     * @class LangInternal
     */
    class LangInternal {
        private data: Array<ILangData>
        private languages: Array<ILanguage>
        private static _instance: LangInternal

        /**
         * Creates an instance of LangInternal.
         * 
         * @memberof LangInternal
         */
        constructor() {
            this.data = new Array<ILangData>()
            this.languages = new Array<ILanguage>()
            this.fetchLangFiles()
            this.loadData()
        }

        /**
         * Returns message for given user/server id.
         *
         * @param {string} id Chosen user/server id.
         * @param {string} msg Message key.
         * @returns {string} Localized phrase.
         * @memberof LangInternal
         */
        getMessage(id: string, msg: string): string {
            var locale = getLanguage(id)
            return this.getMessageInternal(locale, msg)
        }

        /**
         * Add new language or update existing.
         *
         * @param {string} locale Localization literal.
         * @param messages Localization dictionary (Array<[string, string]>).
         * @memberof LangInternal
         */
        registerLanguage(locale: string, messages: Array<[string, string]>) {
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
         *
         * @param {string} locale Localization string.
         * @param {string} message Localization message key.
         * @returns {boolean} Whether message exists in the chosen language or not.
         * @memberof LangInternal
         */
        hasMessage(locale: string, message: string) {
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
         *
         * @param {string} locale Localization string.
         * @returns Language messages (Array<[string, string]>).
         * @memberof LangInternal
         */
        getLanguageMessages(locale: string): Array<[string, string]> {
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
         *
         * @returns {Array<string>} Array with localization strings.
         * @memberof LangInternal
         */
        getAvailableLanguages(): string[] {
            return this.languages.map(lang => lang.locale)
        }

        /**
         * Get language for chosen id.
         *
         * @param {string} id User/server id.
         * @returns {string} Localization string.
         * @memberof LangInternal
         */
        getLanguage(id: string): string {
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
         *
         * @param {string} id User/server id.
         * @param {string} locale New localization string.
         * @memberof LangInternal
         */
        setLanguage(id: string, locale: string): void {
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
         *
         * @private
         * @param {string} locale Localization literal.
         * @param {string} msg Message key.
         * @returns {string} Localized message or key, if localization does not exist.
         * @memberof LangInternal
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
         *
         * @private
         * @param {string} locale Localization literal.
         * @returns {string} Path to the localization file.
         * @memberof LangInternal
         */
        private getPath(locale: string): string {
            return path.join(langfolder, `lang_${locale}.json`)
        }

        /**
         * Load language data.
         *
         * @private
         * @memberof LangInternal
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
         *
         * @private
         * @memberof LangInternal
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
         *
         * @private
         * @param {string} locale
         * @memberof LangInternal
         */
        private saveLangFile(locale: string) {
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
         *
         * @readonly
         * @static
         * @memberof LangInternal
         */
        static get Instance() {
            if (LangInternal._instance === undefined) {
                LangInternal._instance = new LangInternal()
            }
            return LangInternal._instance
        }
    }
}

export default Lang