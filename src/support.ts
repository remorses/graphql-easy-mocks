import fetch from 'node-fetch'

export const sleep = (time) => new Promise((r) => setTimeout(r, time))

export const waitForServices = async (urls) => {
    while (true) {
        const results: string[] = await Promise.all(
            urls.map((url) =>
                fetch(url)
                    .then((_) => 'ok')
                    .catch((x) => x.message),
            ),
        )
        // console.log('results ' + results)
        const errors = results.filter((x) => x.includes('ECONNREFUSED'))
        if (errors.length) {
            await sleep(1000)
            console.log('waiting for services avaliability')
        } else {
            return true
        }
    }
}
