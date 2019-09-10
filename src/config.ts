import * as fs from "fs";
import Log from './log'

export namespace Config{
    const configpath = './config.json'
    class ConfigHandler {
        values: any[]
        constructor(values: Array<any> = []) {
            this.values = values;
        }

        loadConfig(){
            var ex = fs.existsSync(configpath);
            if (!ex) {
                fs.writeFileSync(configpath, JSON.stringify(this.values))
            }
            fs.readFile(configpath, {
                encoding: 'utf-8',
                flag: 'r'
            }, (err, str) => {
                if (err != null) {
                    
                }
            })

        }
    }
}