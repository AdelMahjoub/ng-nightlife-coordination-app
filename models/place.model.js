const db = require('../services/db.service');

const placeSchema = db.Schema({
  id: String,
  going: Number,
});

const Place = db.model('Place', placeSchema);

module.exports = Place;