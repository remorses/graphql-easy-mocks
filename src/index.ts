import { ApolloServer } from 'apollo-server'
import * as fs from 'fs'
import { makeExecutableSchema, addMockFunctionsToSchema } from 'graphql-tools'
import faker from 'faker'
import yargs from 'yargs'

export const main = () => {
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

    const schema = getSchema(process.cwd() + '/' + argv.schema)
    const userMocks = argv.mocks
        ? require(process.cwd() + '/' + argv.mocks)
        : {}
    const mocks = {
        Int: () => Math.round(faker.random.number(100)),
        Float: () => faker.random.number(100) + 0.001,
        String: () => faker.random.words(2),
        Bool: faker.random.boolean,
        ...userMocks
    }

    addMockFunctionsToSchema({ schema, mocks, preserveResolvers: false })

    const server = new ApolloServer({ schema })

    server.listen(argv.port).then(({ url }) => {
        console.log(`🚀  Server ready at ${url}`)
    })
}

const readDirFiles = (schemaPath) => {
    const fileNames = fs.readdirSync(schemaPath)
    return fileNames.map((name) => {
        return fs.readFileSync(name, 'utf8')
    })
}

const getSchema = (schemaPath) => {
    const isDir = fs.lstatSync(schemaPath).isDirectory()
    const typeDefs = isDir
        ? readDirFiles(schemaPath)
        : fs.readFileSync(schemaPath, 'utf8')
    return makeExecutableSchema({ typeDefs })
}
