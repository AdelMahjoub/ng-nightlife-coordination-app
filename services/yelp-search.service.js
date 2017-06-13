const https        = require('https');        
const getYelpToken = require('./yelp-access-token.service');
const querystring  = require('querystring');  

const getPlaces = function(address, callback) {

  getYelpToken( token => {

    const searchQuery = querystring.stringify({
      location: address,
      radius: 20000,
      categories: 'bars',
      sortBy: 'best_match',
    });

    const auth = 'bearer ' + token;

    const options = {
      hostname: 'api.yelp.com',
      port: 443,
      path: '/v3/businesses/search?' + searchQuery,
      method: 'GET',
      headers: {
        'Authorization': auth,
        'Content-type': 'Application/json'
      }
    }

    https.get(options, (res) => {
      
      let data = '';
  
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        return callback(JSON.parse(data));
      });
    });
  });

}

module.exports = getPlaces;