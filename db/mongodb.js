const MongoClient = require('mongodb').MongoClient
const uri = 'mongodb://root:root@localhost:27017/service_listener'
let _db

const connectDB = async (callback) => {
    try {
        MongoClient.connect(uri, (err, client) => {
            _db = client.db('service_listener')
            return callback(err)
        })
    } catch (e) {
        throw e
    }
}

const getDB = () => _db

const disconnectDB = () => _db.close()

module.exports = { connectDB, getDB, disconnectDB }
