import { ApolloServer, ServerInfo } from 'apollo-server'
import chokidar from 'chokidar'
import * as fs from 'fs'
import { makeExecutableSchema, addMockFunctionsToSchema } from 'graphql-tools'
import faker from 'faker'
import yargs from 'yargs'

export default async () => {
    const argv = yargs
        .option('port', {
            alias: 'p',
            description: '',
            type: 'number',
            required: true
        })
        .option('schema', {
            alias: 'f',
            description: '',
            type: 'string',
            default: 'schema.graphql'
        })
        .option('mocks', {
            alias: 'm',
            description: '',
            type: 'string',
            default: null
        })
        .help()
        .alias('help', 'h').argv

    const schemaPath = process.cwd() + '/' + argv.schema
    const mocksPath = argv.mocks ? process.cwd() + '/' + argv.mocks : null
    const watcher = chokidar.watch(schemaPath)
    if (mocksPath) watcher.add(mocksPath)
    let { server } = await main({ mocksPath, schemaPath, port: argv.port })
    watcher.on('ready', () => {
        watcher.on('all', async () => {
            server.close(async () => {
                console.log('restarting server')
                const data = await main({
                    mocksPath,
                    schemaPath,
                    port: argv.port
                })
                server = data.server
            })
        })
    })
}

export const main = async ({
    port,
    schemaPath,
    mocksPath
}): Promise<ServerInfo> => {
    const schema = getSchema(schemaPath)
    const userMocks = mocksPath ? require(mocksPath) : {}
    const mocks = {
        Int: () => Math.round(faker.random.number(100)),
        Float: () => faker.random.number(100) + 0.001,
        String: () => faker.random.words(2),
        Json: () => ({ jsonData: {} }),
        Bool: faker.random.boolean,
        ...userMocks
    }

    addMockFunctionsToSchema({ schema, mocks, preserveResolvers: false })

    const server = new ApolloServer({ schema })
    return await server.listen(port).then((data) => {
        console.log(`🚀  Server ready at ${data.url}`)
        return data
    })
}

const readDirFiles = (schemaPath) => {
    const fileNames = fs.readdirSync(schemaPath)
    return fileNames.map((name) => {
        return fs.readFileSync(schemaPath + name, 'utf8')
    })
}

const getSchema = (schemaPath) => {
    const isDir = fs.lstatSync(schemaPath).isDirectory()
    const typeDefs = isDir
        ? readDirFiles(schemaPath)
        : fs.readFileSync(schemaPath, 'utf8')
    return makeExecutableSchema({ typeDefs })
}
