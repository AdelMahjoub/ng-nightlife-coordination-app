/**
 * // https://www.npmjs.com/package/@google/maps
 */

const googleMapClient = require('@google/maps'); 

const googleMapsOptions = {
  key: process.env.GEOCODING_KEY,
}

const location = googleMapClient.createClient(googleMapsOptions)

module.exports = location;