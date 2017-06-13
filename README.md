# Usage
## Dependencies:
[nodemon](https://github.com/remy/nodemon) only for devolepment.

[forever](https://github.com/foreverjs/forever)

[node-foreman](https://github.com/strongloop/node-foreman)
## Env variables:
Add a **.env** file at the root directory
```
GEOCODING_KEY=<Google Maps Geocoding API KEY>
YELP_APP_ID=<Yelp Fusion Client ID>
YELP_APP_SECRET=<Yelp Fusion Secret Key>
JWTSECRET=<Json web token secret>
DB_URL=<mongo db url>
DB_USER=<mongo db user>
DB_PASS=<mongo db password>
```
## Public folder :
The public folder contains a built Angular 4 app, you can  replace it with your own single page app.

The client angular app [repo](https://github.com/AdelMahjoub/ng-nightlife-client).

Refer to server.js, to check the api endpoints.
## Development mode : 
```$ npm run dev```
## Production mode : 
```$ npm start```