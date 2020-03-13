import { ApolloServer, ServerInfo } from 'apollo-server'
import { GraphQLSchema } from 'graphql'
import faker from 'faker'
import * as fs from 'fs'
import {
    addMockFunctionsToSchema,
    makeExecutableSchema,
    introspectSchema,
} from 'graphql-tools'

export const main = async ({
    port,
    schemaPath = '',
    url = '',
    mocksPath = '',
}): Promise<ServerInfo> => {
    const schema = schemaPath
        ? await getSchemaFromPath(schemaPath)
        : await getSchemaFormUrl(url)
    delete require.cache[require.resolve(mocksPath)]
    const userMocks = mocksPath ? require(mocksPath) : {}
    const mocks = {
        Int: () => Math.round(faker.random.number(100)),
        Float: () => faker.random.number(100) + 0.001,
        String: () => faker.random.words(2),
        Json: () => ({ json: {} }),
        Bool: faker.random.boolean,
        ...userMocks,
    }
    addMockFunctionsToSchema({ schema, mocks, preserveResolvers: false })
    const server = new ApolloServer({ schema })
    return await server.listen(port).then((data) => {
        console.log(`🚀 Server ready at ${data.url}`)
        return data
    })
}

const readDirFiles = (schemaPath) => {
    const fileNames = fs.readdirSync(schemaPath)
    return fileNames.map((name) => {
        return fs.readFileSync(schemaPath + name, 'utf8')
    })
}

const getSchemaFromPath = (schemaPath) => {
    const isDir = fs.lstatSync(schemaPath).isDirectory()
    const typeDefs = isDir
        ? readDirFiles(schemaPath)
        : fs.readFileSync(schemaPath, 'utf8')
    return makeExecutableSchema({ typeDefs })
}

async function getSchemaFormUrl(url): Promise<GraphQLSchema> {
    const schema = await introspectSchema(url)
    return schema
}
