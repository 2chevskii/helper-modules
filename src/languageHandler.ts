import * as fs from 'fs'
import path from 'path'

const defaultlocale = 'en'
const localesfolder = './locales'
const serversettingspath = path.join(localesfolder, 'serversettings.json')
const defaultlocalefile = path.join(localesfolder, `lang_${defaultlocale}.json`)

interface LanguageData {
    languages: Array<{}>
    serversettings: Array<string>
}

export class LanguageHandler {
    private data: LanguageData
    constructor(defaultMessages: {}) {
        this.data = {
            languages: new Array<{}>(),
            serversettings: new Array<string>()
        }
        this.loadSettings();
        this.loadDefaultMessages(defaultMessages);
        this.loadOtherLanguages();
    }

    private loadSettings() {
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

    registerLanguage(locale: string, messages: {}) {
        if (this.data.languages[locale] != undefined) {
            return false;
        }

        this.data.languages[locale] = messages
        fs.writeFileSync(path.join(localesfolder, `lang_${locale}.json`), JSON.stringify(this.data.languages[locale]))
        return true;
    }

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

    setServerLanguage(id: string, locale: string) {
        this.data.serversettings[id] = locale;
    }

    getServerLanguage(id: string) {
        let lang = this.data.serversettings[id];
        if (lang == undefined) {
            lang = defaultlocale;
            this.setServerLanguage(id, lang);
        }
        return lang;
    }

    getMessage(id: string, key: string) {
        let locale = this.getServerLanguage(id);
        return this.getMessageLocale(locale, key);
    }

    private getMessageLocale(locale: string, key: string) {
        return this.data.languages[locale][key];
    }
}