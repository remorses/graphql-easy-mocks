import { main } from './main'

const URL = process.env.URL
const MOCKS_PATH = process.env.MOCKS_PATH
const PORT = Number(process.env.PORT || '80')

if (!URL || !MOCKS_PATH || !PORT) {
    console.log('missing env vars')
    process.exit(1)
}

async function go() {
    try {
        main({
            port: PORT,
            mocksPath: MOCKS_PATH,
            url: URL,
        })
    } catch (e) {
        console.error(e)
    }
}

go()
