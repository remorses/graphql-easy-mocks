const faker = require('faker')

module.exports = {
    String: () => 'works!',
    Int: () => faker.random.number(100),
}
