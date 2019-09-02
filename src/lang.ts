import * as fs from 'fs'
import path from 'path'

export class Lang {
    private languages: Array<Array<string>>;
    private serversettings: Array<string>;
    private defaultlanguage: string;
    constructor(deflocale: string, defmessages: Array<string>) {
        this.languages = new Array<Array<string>>();
        this.languages[deflocale] = defmessages
        this.serversettings = new Array<string>()
        this.defaultlanguage = deflocale
    }

    loadMessages(folder: string) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }

        var files = fs.readdirSync(folder);
        let defname = `lang_${this.defaultlanguage}.json`;
        let defaultexists = files.find((name) => name == defname)
        if (!defaultexists) {
            fs.writeFileSync(path.join(folder, defname), JSON.stringify(this.languages[this.defaultlanguage], null, '\t'))
        }

        let langfiles = fs.readdirSync(folder).filter((name) => name.startsWith('lang_') && name.endsWith('.json'))
        langfiles.forEach(file => {
            let curlocale = file.replace('lang_', '').replace('.json', '');
            try {
                this.languages[curlocale] = JSON.parse(fs.readFileSync(path.join(folder, file), {
                    encoding: 'utf-8',
                    flag: 'r'
                }))
            } catch {
                this.languages[curlocale] = this.languages[this.defaultlanguage]
                fs.writeFileSync(path.join(folder, file), JSON.stringify(this.languages[curlocale], null, '\t'))
            }
        });
    }

    getMessage(id: string, key: string) {
        return this.getMessagePrivate(this.getServerLanguage(id), key);
    }

    private getMessagePrivate(locale: string, key: string) {
        return this.languages[locale][key];
    }

    setServerLanguage(id: string, locale: string) {
        this.serversettings[id] = locale
    }

    getServerLanguage(id: string) {
        const serverlang = this.serversettings[id];
        if (serverlang == undefined) {
            this.serversettings[id] = this.defaultlanguage;
            return this.defaultlanguage;
        }
        return serverlang;
    }

    getAvailableLanguages() {
        return Object.keys(this.languages);
    }
}

export default { Lang }