/**
 * Node modules
 */
const express    = require('express');       // http://expressjs.com/
const bodyParser = require('body-parser');   // https://github.com/expressjs/body-parser
const path       = require('path');          // https://nodejs.org/api/path.html
const cors       = require('cors');          // https://www.npmjs.com/package/cors
const helmet     = require('helmet');        // https://github.com/helmetjs/helmet
const expressJwt = require('express-jwt');   // https://github.com/auth0/express-jwt
const jwt        = require('jsonwebtoken');  // https://github.com/auth0/node-jsonwebtoken

/**
 * Services
 */
const locationService  = require('./services/location.service'); 
const getPlaces        = require('./services/yelp-search.service');

/**
 * Models
 */
const User  = require('./models/user.model');
const Place = require('./models/place.model'); 

/**
 * Express app instance
 */
const app = express();

/**
 * Set app port
 */
app.set('port', process.env.PORT || 3000);

/**
 * Disable Express signature
 */
app.disable('x-powered-by');

/**
 * Middlewares on NODE_ENV=production
 */
if(app.get('env') === 'production') {
  app.enable('trust-proxy');
  app.use(helmet.xssFilter());
  app.use(helmet.noSniff());
  app.use(helmet.frameguard({
    action: 'deny'
  }));
}
//app.use(cors());

/**
 * Middlewares
 */
// Xhr communication with client
app.use(bodyParser.json());

// Static files
app.use(express.static(path.resolve(__dirname, 'public')));

// expressJWT config
app.use(
  expressJwt({
    secret: process.env.JWTSECRET,
    credentialsRequired: true,
    getToken: function fromHeader(req, res, next) {
      if(req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
      }
      return null;
    }
  })
  .unless({
    path: [
      '/',
      '/favicon.ico',
      '/places',
      '/login',
      '/signup',
      '/api/location',
      '/api/places-by-address',
      '/api/login',
      '/api/signup',
      '/api/check-token',
      ]
  }), (err, req, res, next) => {
    if(err) return next(err);
    else  return next();
  }
)

//////////////////////////////////////
//                                  //
//         api endpoints            //
//                                  //
//////////////////////////////////////


/**
 * If the user uses the geolocation button 
 * - then return the user address
 * if the errorCode equals 0 [user approved navigator.geoloction]: 
 *  - we use Google ReverseGeocode API to get address from latlng
 * 
 * Note: this end point is just a convenience to give the user his address
 */
app.post('/api/location', (req, res, next) => {
  /////////////////////
  // req.body = {
  //  latitude: number,
  //  longitude: number,
  //  errorCode: number
  // }
  /////////////////////
  let clientCoords = req.body;
  let lang = req.get('accept-language').split('-')[0];
  if(clientCoords.errorCode === 0) {
    let coords = `${clientCoords.latitude},${clientCoords.longitude}`; 
    locationService.getAddressFromCoords(coords, lang, (err, data) => {
      if(err) return res.json(err);
      else return res.json(data);
    }); 
  } else {
    return res.json({address: ''});
  }
});

/**
 * return nearby places relative to posted address
 */
app.post('/api/places-by-address', (req, res, next) => {
  ///////////////////////////////////
  // req.body
  // {
  //  address: string,
  // }
  //
  ///////////////////////////////////
  let address = req.body.address;
  getPlaces(address, (data) => {
    // Update places
    // Add property 'going' to all place
    // The places collection stores all the visted places
    // and store how many users are going to that place in the going property
    if(Array.isArray(data.businesses)) {
      data.businesses.forEach((business, index) => {
        business.going = 0;
        Place.findOne({id: business.id}, (err, place) => {
          if(place) {
            business.going = place.going;
          }
          if(index >= data.businesses.length - 1) return res.json(data);
        });
      });
    } else {
      next();
    }
  });
});

/**
 * Update user destination
 * Increment the place's going property if it is stored in the places collection
 * Or create a new one
 * This is the only protected route, which need the user to be authenticated 
 */
app.post('/api/update', (req, res, next) => {
  //////////////////////////////////////
  // req.body
  // {
  //   userId: string,
  //   placeId: string,
  // }
  //////////////////////////////////////
  
  let userId  = req.body.userId;
  let placeId = req.body.placeId;
  let errors  = [];

  User.findById(userId, (err, user) => {
    if(err) {
      errors.push('Unexpected error.');
      return res.json({errors});
    }
    if(!user) {
      errors.push('User not found.');
      return res.json({errors});
    }
    let index = user.destinations.indexOf(placeId);
    action = index !== -1 ? 'pull' : 'push';
    
    switch(action) {
      case 'push':
        User.findOneAndUpdate({_id: userId}, {$push: {destinations: placeId}}, (err, user) => {
          if(err) {
            errors.push('Unexpected error, please try again.');
            return res.json({errors})
          }
          if(!user) {
            errors.push('User not found.');
            return res.json({errors})
          }
          Place.findOneAndUpdate({id: placeId}, {$inc: {going: 1}}, {upsert: true, new: true}, (err, place) => {
            if(err) {
              errors.push('Unexpected error, please try again.');
              return res.json({errors})
            }
            // Return the updated property
            Place.findOne({id: place.id},  (err, place) => {
              if(err) {
                errors.push('Unexpected error, please try again.');
                return res.json({errors})
              }
              return res.json({going: place.going});
            });
          });
        });
      break;
      case 'pull':
        User.findOneAndUpdate({_id: userId}, {$pull: {destinations: placeId}}, (err, user) => {
          if(err) {
            errors.push('Unexpected error, please try again.');
            return res.json({errors})
          }
          if(!user) {
            errors.push('User not found.');
            return res.json({errors})
          }
          Place.findOneAndUpdate({id: placeId}, {$inc: {going: -1}}, (err, place) => {
            if(err) {
              errors.push('Unexpected error, please try again.');
              return res.json({errors})
            }
            // Return the updated property
            Place.findOne({id: place.id},  (err, place) => {
              if(err) {
                errors.push('Unexpected error, please try again.');
                return res.json({errors})
              }
              return res.json({going: place.going});
            });
          });
        });
      break;
      default:
    }
  });
});

/**
 * Login user
 * Check if the credentials are valid then respond with a jwt token
 */
app.post('/api/login', (req, res, next) => {
  ///////////////////////////
  // req.body
  // {
  //    email: string
  //    password: string   
  // }
  ///////////////////////////
  let email = req.body.email;
  let password = req.body.password;
  let validationErrors = [];
  User.findOne({email: email}, (err, user) => {
    if(err) {
      validationErrors.push('Unexpected error.');
      return res.json({errors: validationErrors});
    }
    if(!user) {
      validationErrors.push('Invalid email or password.');
      return res.json({errors: validationErrors});
    }
    if(user) {
      user.comparePasswords(password, user.password, (err, isMatch) => {
        if(err) {
          validationErrors.push('Unexpected error.');
          return res.json({errors: validationErrors});
        } 
        if(!isMatch) {
          validationErrors.push('Invalid email or password.');
          return res.json({errors: validationErrors});
        }
        jwt.sign({id: user._id}, process.env.JWTSECRET, (err, token) => {
          return res.json({token, userId: user._id});
        });
      });
    }
  });
});

/**
 * Signup user
 */
app.post('/api/signup', (req, res, next) => {
  ///////////////////////////
  // req.body
  // {
  //    email: string
  //    password: string   
  // }
  ///////////////////////////
  let validationErrors = [];

  let newUser = new User({
    email: req.body.email,
    password: req.body.password
  });
  User.create(newUser, (err, result) => {
    if(err) {
      Object.keys(err.errors).forEach(key => {
        validationErrors.push(err.errors[key]['message'])
      });
    }
    return res.json({errors: validationErrors});
  });
});

/**
 * Check jwt token
 */
app.post('/api/check-token', (req, res, next) => {
  ///////////////////////
  // req.body
  // {
  //  token: string  
  // }
  ///////////////////////
  if(!req.body['token']) res.json(false);
  else {
    let token = req.body.token;
    jwt.verify(token, process.env.JWTSECRET, (err, decoded) => {
      if(err) return res.json(false);
      else {
        let id = decoded.id;
        User.findById(id, (err, user) => {
          if(err) return res.json(false);
          if(!user) return res.json(false);
          else return res.json(true);
        });
      }
    });
  }
});

// Redirect all unmatched routes to index.html, single page app
app.get('*', (req, res, next) => {
  res.sendFile(path.resolve(__dirname, 'public/index.html'));
});

// Redirect all unauthorizd routes routes to /
app.use((err, req, res, next) => {
  res.redirect('/')
});

app.listen(app.get('port'), () => {
  console.log('Server running on ' + app.get('env') + ' mode.');
});
