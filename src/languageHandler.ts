import * as fs from 'fs'
import path from 'path'

export namespace Lang{
    // These values are not intended to be modified, do that only if you really know what you are doing
/** Default localization literal ('en' - for English) */
const defaultlocale = 'en'
/** Folder which must contain all the language files */
const localesfolder = './locales'

// Do not modify these for sure, easy way to mess up all of it
const serversettingspath = path.join(localesfolder, 'serversettings.json')
const defaultlocalefile = path.join(localesfolder, `lang_${defaultlocale}.json`)

/**
 * Represents container for server language preferences storage throughout the app sessions
 */
interface ILanguageData {
    /** Dictionaries with phrases */
    languages: Array<{}>
    /** Server locales */
    serversettings: Array<string>
}

/**
 * General export class, instantiate this if you want to use this module features
 */
export class LanguageHandler {
    /** Stores server preferences and phrases throughout the sessions */
    private data: ILanguageData
    /**
     * Initializes new LanguageHandler object
     * @param defaultMessages Dictionary with phrases for default localization (`en`)
     */
    constructor(defaultMessages: {}) {
        this.data = {
            languages: new Array<{}>(),
            serversettings: new Array<string>()
        }
        this.loadSettings();
        this.loadDefaultMessages(defaultMessages);
        this.loadOtherLanguages();
    }

    /** Create new or load existing preferences file */
    private loadSettings() {
        if (!fs.existsSync(localesfolder)) {
            fs.mkdirSync(localesfolder);
        }
        if (!fs.existsSync(serversettingspath)) {
            
            fs.writeFileSync(serversettingspath, JSON.stringify(this.data.serversettings, null, '\t'))
        }

        try {
            this.data.serversettings = JSON.parse(fs.readFileSync(serversettingspath, {
                encoding: 'utf-8',
                flag: 'r'
            }))
        } catch {
            this.data.serversettings = new Array<string>();
            fs.unlinkSync(serversettingspath);
            this.loadSettings();
        }
    }

    /** Create new or load existing phrases from file */
    private loadDefaultMessages(defaultMessages: {}) {
        if (!fs.existsSync(defaultlocalefile)) {
            fs.writeFileSync(defaultlocalefile, JSON.stringify(defaultMessages))
        }

        try {
            this.data.languages[defaultlocale] = JSON.parse(fs.readFileSync(defaultlocalefile, {
                encoding: 'utf-8',
                flag: 'r'
            }))
        } catch {
            fs.unlinkSync(defaultlocalefile);
            this.loadDefaultMessages(defaultMessages);
        }
    }

    /** Load other localizations */
    private loadOtherLanguages() {
        fs.readdirSync(localesfolder).forEach(file => {
            if (file.startsWith('lang_') && file.endsWith('.json')) {
                let locale = file.replace('lang_', '').replace('.json', '')
                if (locale != defaultlocale) {
                    try {
                        this.data.languages[locale] = JSON.parse(fs.readFileSync(path.join(localesfolder, file), {
                            encoding: 'utf-8',
                            flag: 'r'
                        }))
                    } catch {
                        fs.unlinkSync(path.join(localesfolder, file))
                        console.log('Deleted ' + file + ' localization file as it does not contain valid json')
                    }
                }
            }
        });
    }

    /**
     * Register new localization, automatically creates file, which can be modified by hand to change appearance of phrases
     * @param {string} locale String literal representing the localization (for example: 'en' states for English language)
     * @param messages Dictionary which must contain all the phrases for chosen language
     * @returns {boolean} `true` if the language was registered successfully, `false` if the language already exists
     */
    registerLanguage(locale: string, messages: {}) {
        if (this.data.languages[locale] != undefined) {
            return false;
        }

        this.data.languages[locale] = messages
        fs.writeFileSync(path.join(localesfolder, `lang_${locale}.json`), JSON.stringify(this.data.languages[locale]))
        return true;
    }

    /**
     * Delete both object and file for the selected localization
     * @param {string} locale String literal representing the localization (for example: 'en' states for English language)
     * @returns {boolean} `true` if the language was successfully deleted, `false` if the language does not exist
     */
    unregisterLanguage(locale: string) {
        if (this.data.languages[locale] == undefined) {
            return false;
        }

        if (locale == defaultlocale) {
            return false;
        }

        this.data.languages[locale] = undefined;
        fs.unlinkSync(path.join(localesfolder, `lang_${locale}.json`))
        return true;
    }

    /**
     * Set new localization for selected server
     * @param {string} id Serverid
     * @param {string} locale String literal representing the localization (for example: 'en' states for English language)
     */
    setServerLanguage(id: string, locale: string) {
        this.data.serversettings[id] = locale;
    }

    /**
     * Get current server localization
     * @param {string} id Serverid
     * @returns {string} String literal representing the localization (for example: 'en' states for English language)
     */
    getServerLanguage(id: string) {
        let lang = this.data.serversettings[id];
        if (lang == undefined) {
            lang = defaultlocale;
            this.setServerLanguage(id, lang);
        }
        return lang;
    }

    /**
     * Get localized message for server
     * @param {string} id Serverid
     * @param {string} key Dictionary phrase key
     * @returns {string | undefined} Phrase, if it exists
     */
    getMessage(id: string, key: string) {
        let locale = this.getServerLanguage(id);
        return this.getMessageLocale(locale, key);
    }

    /** Internal way to get message */
    private getMessageLocale(locale: string, key: string) {
        return this.data.languages[locale][key];
    }

    //TODO: Make functions to get all available languages, and make getMessage create default language file for given locale if it does not exist
}
}

export default Lang