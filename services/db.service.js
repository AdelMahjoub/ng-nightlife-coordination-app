/**
 * node modules
 */
const mongoose = require('mongoose'); // http://mongoosejs.com/
const bluebird = require('bluebird'); // http://bluebirdjs.com/docs/getting-started.html

// Set mongoose promise library to bluebird
// http://mongoosejs.com/docs/promises.html
mongoose.Promise = bluebird;

// DB connection options
const options = {
  user: process.env.DB_USER,
  pass: process.env.DB_PASS,
  server: {
    socketOptions: {
      keepAlive: 1
    }
  }
};

// DB connection instance
const db = mongoose.connect(process.env.DB_URL, options);

db.connection.on('error', () => {
  console.log('Unable to connect to db');
});

db.connection.on('open', () => {
  console.log('Mongoose version: ' + db.version + '\nConnexion to db success.');
});

module.exports = db;