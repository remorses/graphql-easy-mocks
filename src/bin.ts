import chokidar from 'chokidar'
import * as fs from 'fs'
import yargs from 'yargs'
import { main } from './main'

export default async () => {
    const argv = yargs
        .option('port', {
            alias: 'p',
            description: '',
            type: 'number',
            required: true,
        })
        .option('schema', {
            alias: 'f',
            description: '',
            type: 'string',
            default: 'schema.graphql',
        })
        .option('mocks', {
            alias: 'm',
            description: '',
            type: 'string',
            default: null,
        })
        .help()
        .alias('help', 'h').argv

    const schemaPath = process.cwd() + '/' + argv.schema
    const mocksPath = argv.mocks ? process.cwd() + '/' + argv.mocks : ''
    const watcher = chokidar.watch(schemaPath)
    if (mocksPath) watcher.add(mocksPath)
    let { server } = await main({
        mocksPath,
        schemaPath,
        port: argv.port,
        preserveMutations: false,
    })
    watcher.on('ready', () => {
        watcher.on('all', async () => {
            server.close(async () => {
                console.log('restarting server')
                const data = await main({
                    mocksPath,
                    schemaPath,
                    port: argv.port,
                    preserveMutations: false,
                })
                server = data.server
            })
        })
    })
}

const readDirFiles = (schemaPath) => {
    const fileNames = fs.readdirSync(schemaPath)
    return fileNames.map((name) => {
        return fs.readFileSync(schemaPath + name, 'utf8')
    })
}
