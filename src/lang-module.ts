import fs from 'fs'
import { Log } from './log-module'
import path from 'path'

export namespace Lang {

    const langfolder = `.${path.sep}helper-modules${path.sep}locales`

    const langdatafile = `.${path.sep}helper-modules${path.sep}lang-module.json`

    /**
     *
     *
     * @export
     * @param {string} id
     * @param {string} key
     * @returns {string}
     */
    export function getMessage(id: string, key: string): string {
        return LangInternal.Instance.getMessage(id, key)
    }


    /**
     *
     *
     * @export
     * @param {Array<[string, string]>} messages
     * @param {string} [lang='en']
     * @returns {boolean}
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
     *
     *
     * @export
     * @param {string} lang
     * @param {string} key
     * @returns {boolean}
     */
    export function hasMessage(lang: string, key: string): boolean {
        return LangInternal.Instance.hasMessage(lang, key)
    }

    /**
     *
     *
     * @export
     * @param {string} lang
     * @returns {Array<[string, string]>}
     */
    export function getLanguageMessages(lang: string): Array<[string, string]> {
        return LangInternal.Instance.getLanguageMessages(lang)
    }

    /**
     *
     *
     * @export
     * @returns {string[]}
     */
    export function getAvailableLanguages(): string[] {
        return LangInternal.Instance.getAvailableLanguages()
    }

    /**
     *
     *
     * @export
     * @param {string} id
     * @returns {string}
     */
    export function getLanguage(id: string): string {
        return LangInternal.Instance.getLanguage(id)
    }

    /**
     *
     *
     * @export
     * @param {string} id
     * @param {string} lang
     * @returns {void}
     */
    export function setLanguage(id: string, lang: string): void {
        return LangInternal.Instance.setLanguage(id, lang)
    }

    /**
     *
     *
     * @interface ILangData
     */
    interface ILangData {
        id: string
        locale: string
    }

    /**
     *
     *
     * @interface ILanguage
     */
    interface ILanguage {
        locale: string
        messages: Array<[string, string]>
    }

    /**
     *
     *
     * @class LangInternal
     */
    class LangInternal {
        private data: Array<ILangData>
        private languages: Array<ILanguage>
        private static _instance: LangInternal

        /**
         *Creates an instance of LangInternal.
         * @memberof LangInternal
         */
        constructor() {
            this.data = new Array<ILangData>()
            this.languages = new Array<ILanguage>()
            this.fetchLangFiles()
            this.loadData()
        }

        /**
         *
         *
         * @param {string} id
         * @param {string} msg
         * @returns
         * @memberof LangInternal
         */
        getMessage(id: string, msg: string) {
            var locale = getLanguage(id)
            return this.getMessageInternal(locale, msg)
        }

        /**
         *
         *
         * @param {string} locale
         * @param {Array<[string, string]>} messages
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
         *
         *
         * @param {string} locale
         * @param {string} message
         * @returns
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
         *
         *
         * @param {string} locale
         * @returns
         * @memberof LangInternal
         */
        getLanguageMessages(locale: string) {
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
         *
         *
         * @returns
         * @memberof LangInternal
         */
        getAvailableLanguages() {
            return this.languages.map(lang => lang.locale)
        }

        /**
         *
         *
         * @param {string} id
         * @returns {string}
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
         *
         *
         * @param {string} id
         * @param {string} locale
         * @memberof LangInternal
         */
        setLanguage(id: string, locale: string) {
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
         *
         *
         * @private
         * @param {string} locale
         * @param {string} msg
         * @returns
         * @memberof LangInternal
         */
        private getMessageInternal(locale: string, msg: string) {
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
         *
         *
         * @private
         * @param {string} locale
         * @returns
         * @memberof LangInternal
         */
        private getPath(locale: string) {
            return path.join(langfolder, `lang_${locale}.json`)
        }

        /**
         *
         *
         * @private
         * @memberof LangInternal
         */
        private loadData() {
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
         *
         *
         * @private
         * @memberof LangInternal
         */
        private fetchLangFiles() {
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
         *
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
         *
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