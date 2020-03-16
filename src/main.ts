import { ApolloServer, ServerInfo } from 'apollo-server'
import { GraphQLSchema } from 'graphql'
import faker from 'faker'
import * as fs from 'fs'
import { HttpLink } from 'apollo-link-http'
import { extractResolversFromSchema } from 'graphql-toolkit'
import fetch from 'node-fetch'

import {
    addMockFunctionsToSchema,
    makeExecutableSchema,
    introspectSchema,
    mergeSchemas,
    makeRemoteExecutableSchema,
    addResolveFunctionsToSchema,
} from 'graphql-tools'
import { waitForServices } from './support'

export const main = async ({
    port,
    schemaPath = '',
    url = '',
    mocksPath = '',
    preserveMutations,
    queriesToPreseserve = [],
}): Promise<ServerInfo> => {
    const schema = schemaPath
        ? await getSchemaFromPath(schemaPath)
        : await getSchemaFormUrl(url)
    const original = await makeRemoteExecutableSchema({
        schema,
        link: new HttpLink({ uri: url, fetch: fetch as any }),
    })
    if (mocksPath) {
        delete require.cache[require.resolve(mocksPath)]
    }
    const userMocks = mocksPath ? require(mocksPath) : {}

    // console.log(originalResolvers['Mutation'])
    const mocks = {
        Int: () => Math.round(faker.random.number(100)),
        Float: () => faker.random.number(100) + 0.001,
        String: () => faker.random.words(2),
        Json: () => ({ json: {} }),
        ObjectId: () => '000000111111222222333333',
        DateTime: () => new Date(),
        // TODO maybe add Date, DateTime, Time, _Any
        Bool: faker.random.boolean,
        ...userMocks,

        // Mutation: original.getMutationType().resolveObject,
    }
    const originalResolvers = extractResolversFromSchema(original)
    const Mutation = originalResolvers['Mutation'] || {}
    const Query = originalResolvers['Query'] || {}
    const selectedQueries = Object.keys(Query)
        .filter((k) => queriesToPreseserve.includes(k))
        .map((k) => ({ [k]: Query[k] }))
    addResolveFunctionsToSchema({
        schema,
        resolvers: {
            Mutation,
            Query: {
                ...Object.assign({}, ...selectedQueries),
            },
        },
        resolverValidationOptions: { requireResolversForResolveType: false },
    })

    addMockFunctionsToSchema({
        schema,
        mocks,
        preserveResolvers: true,
    })
    original.getMutationType()
    const server = new ApolloServer({
        schema,
        // schema: mergeSchemas({
        //     schemas: [schema, original],

        //     onTypeConflict: (l, r, info) => {
        //         console.log(info)
        //         return r
        //     },
        // }),
    })
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

async function getSchemaFormUrl(uri): Promise<GraphQLSchema> {
    await waitForServices([uri])
    const link = new HttpLink({ uri, fetch: fetch as any })
    const schema = await introspectSchema(link)
    return schema
}
