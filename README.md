## Usage

```
version: "3"

services:
  mocker:
    image: mongoke/graphql-mocker
    ports:
      - 7090:80
    environment:
      - PORT=80
      - URL=http://gqlapi:8080/graphql
      - MOCKS_PATH=/mocks.js
      - PRESERVE_MUTATIONS=1 
      # maintain mutations from original schema
      - PRESERVE_QUERIES=allAssets, queryName
      # maintain certain queries
    volumes:
      - ./tests/mocks.js:/mocks.js
  gqlapi:
    ports:
      - 7060:8080
    build: your api
```

## Usage as cli

## Install

```
npm install -g graphql-easy-mocks
```

## Then run

`graphql-easy-mocks --port 9000 -f schema.graphql -m mocks.js`

```javascript
// mocks.js

const faker = require('faker')

module.exports = {
    String: () => 'works!',
    Int: () => faker.random.number(100),
}
```

Then start the server with the app

```json
"scripts": {
    "start": "REACT_APP_TESTING=1 concurrently 'npm:mock-server' 'react-scripts start'",
    "mock-server": "graphql-easy-mocks -p 9000 -f schema.graphql -m mocks.js",
}
```

Then use it as your server url inside your app.

```js
import ApolloClient from 'apollo-boost'

const uri = process.env.REACT_APP_TESTING
    ? 'http://localhost:9000'
    : 'https://countries.trevorblades.com'
export default new ApolloClient({
    uri,
})
```
