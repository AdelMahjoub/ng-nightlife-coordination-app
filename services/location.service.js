const http     = require('http');
const location = require('./google-maps.service');

/**
 * 
 * @param coords: string `${latitude},${longitude}` 
 * @param lang: string 
 * @param callback: response 
 */
const getAddressFromCoords = function(coords, lang, callback) {
  // Needed by google maps reverse geocode 
  // https://developers.google.com/maps/documentation/geocoding/intro
  
  let reverseGeoParams = {
    latlng: coords,
    result_type: 'street_address|locality|postal_code',
    language: lang,
    location_type: 'ROOFTOP'
  }

  ///////////////////////////////////////////////////////////////////
  // reverseGeocode response
  //
  // data.json = {
  //  results [
  //    {
  //      ...
  //      formatted_address: string,    
  //      place_id: string             
  //    }
  //  ],
  //  status: string "OK" | "ZERO_RESULTS"
  // }
  ////////////////////////////////////////////////////////////////////
  location.reverseGeocode(reverseGeoParams, (err, data) => {
    if(err) {
      return callback(err);
    } else {
      if(data.json.status === "OK") {
        return callback({
          address: data.json.results[0].formatted_address,
          placeId: data.json.results[0].place_id});
      } else {
        return callback({address: ''});
      }
      
    }
  })
}

module.exports = {
  getAddressFromCoords
}