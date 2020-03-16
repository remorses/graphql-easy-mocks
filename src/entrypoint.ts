import { main } from './main'
import fs from 'fs'
import path from 'path'

const URL = process.env.URL
const MOCKS_PATH = process.env.MOCKS_PATH
const PRESERVE_MUTATIONS = process.env.PRESERVE_MUTATIONS
const PORT = Number(process.env.PORT || '80')

if (!URL || !PORT) {
    console.log('missing env vars')
    process.exit(1)
}

const DEFAULT_MOCKS_PATH = path.resolve(__dirname, 'mocks.js')

async function go() {
    if (MOCKS_PATH) {
        const data = await fs.promises.readFile(MOCKS_PATH)
        await fs.promises.writeFile(DEFAULT_MOCKS_PATH, data)
    }
    try {
        main({
            port: PORT,
            mocksPath: MOCKS_PATH && DEFAULT_MOCKS_PATH,
            url: URL,
            preserveMutations: PRESERVE_MUTATIONS
        })
    } catch (e) {
        console.error(e)
    }
}

go()
