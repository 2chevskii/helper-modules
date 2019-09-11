import * as fs from 'fs'
import path from 'path'
import { Log } from './log'

export namespace Lang {
    // These values are not intended to be modified, do that only if you really know what you are doing
    /** Folder which must contain all the language files */
    const localesfolder = './locales'

    const logger = new Log.LogHandler('lang-module')

    export class LanguageHandler {
        private languages: Array<{}>
        private langdata: Object
        constructor() {
            this.languages = new Array<{}>()
            this.langdata = {}
            this.loadLanguageFiles()
            this.loadLangData()
        }

        private loadLangData(){
            if (!fs.existsSync('./lang_data.json')) {
                this.saveLangData();
            }
            try {
                this.langdata = JSON.parse(fs.readFileSync('./lang_data.json', {encoding:'utf-8', flag:'r'}))
                if(this.langdata == undefined || this.langdata == null){
                    throw 'Error while reading language data';
                }
            } catch (error) {
                logger.writeLogFile(error)
                this.langdata = {}
                this.saveLangData()
            }
        }

        private saveLangData(){
            fs.writeFileSync('./lang_data.json', JSON.stringify(this.langdata, null, '\t'))
        }

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

        private saveLanguageFiles(){
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

        getLanguage(id:string){
            if (this.langdata[id] == undefined) {

                this.langdata[id] = Object.keys(this.languages)[0]
                this.saveLangData()
            }
            return this.langdata[id]
        }

        getAllLanguages(){
            return Object.keys(this.languages)
        }

        getAllLanguageMessages(locale:string){
            return Object.keys(this.languages[locale])
        }

        registerLanguage(locale:string, messages: {}){
            if (!this.existsLanguage(locale)) {
                this.languages[locale] = messages
            }
            else{
                for(let msg of Object.keys(messages)){
                    if (this.languages[locale][msg] == undefined) {
                        this.languages[locale][msg] = messages[msg]
                    }
                }
            }
            this.saveLanguageFiles();
        }

        setLanguage(id:string, locale:string){
            this.langdata[id] = locale
            this.saveLangData()
        }

        getMessage(id:string, key:string){
            return this.getMessageInternal(this.getLanguage(id), key)
        }

        private getMessageInternal(locale:string, key:string){
            if (!this.existsMessage(locale, key)) {
                return key;
            }
            else{
                return this.languages[locale][key]
            }
        }

        existsMessage(locale:string, key:string){
            if (!this.existsLanguage(locale)) {
                return false;
            }
            return this.languages[locale][key] != undefined
        }

        existsLanguage(locale:string){
            return this.languages[locale] != undefined
        }

        private getPath(locale: string) {
            return path.join(localesfolder, `lang_${locale}.json`)
        }
    }
}

export default Lang