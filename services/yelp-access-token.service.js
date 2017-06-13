/**
 * Node modules
 */
const https       = require('https');        // https://nodejs.org/api/https.html
const querystring = require('querystring');  // https://nodejs.org/api/querystring.html 
const util        = require('util');         // https://nodejs.org/api/util.html
const NodeCache   = require( "node-cache" ); // https://www.npmjs.com/package/node-cache

/**
 * Caching option
 */
const cache = new NodeCache({
  stdTTL: 15552000,
  checkperiod: 120,
  errorOnMissing: true
});

/**
 * Get yelp api token from cache
 * If the token is not cached or expired, recursively update the token then return it
 * @param {*} callback
 */
const getYelpToken = function(callback) {
  cache.get('yelpToken', (err, value) => {
    if(!err) {
      if(value === undefined) {
        return updateYelpToken(callback);
      } else {
        return callback(value)
      }
    } else {
      return updateYelpToken(callback);
    }
  })
}

/**
 * https://www.yelp.ca/developers/documentation/v3/authentication
 * 
 * Update yelp api token then recursively return the token
 * @param {*} callback 
 */

const updateYelpToken = function(callback) {
  // console.log('Updating yelp token');
  // Data to post to get access token from yelp
  const data = querystring.stringify({
    client_id: process.env.YELP_APP_ID,
    client_secret: process.env.YELP_APP_SECRET
  });

  // The post request options
  const options = {
    hostname: 'api.yelp.com',
    port: 443,
    path: '/oauth2/token',
    method: 'POST',
    Headrers: {
      'Content-Type': 'Application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data)
    }
  }

  // post request to yelp then cache the api token  
  const req = https.request(options, (res) => {
    res.on('data', (data) => {
      /////////////////////////////////////
      // data
      // {
      //   "access_token": "ACCESS_TOKEN",
      //   "token_type": "bearer",
      //   "expires_in": 15552000
      // }
      ///////////////////////////////////////
      let payload = JSON.parse(data.toString());
      cache.set('yelpToken', payload['access_token'], payload['token_type'], (err, success) => {
        if(!err && success) {
          return getYelpToken(callback);
        }
      });
    });
  });

  req.on('error', (e) => {
    console.error('error: ' + e);
  });
  req.write(data);
  req.end();
}

const storeToken = function() {

}


module.exports = getYelpToken; 