# node-short, a url-shortener service based on node.js

`node-short` is a basic URL shortener written in JavaScript for Node.js, using some jQuery front-end fun bits and MongoDB for URL storage. New URLs can be added via a form or via a basic API:

    dawnrider:node-short sivy$ curl --data "url=http://dashes.com/anil/&format=json" localhost:3000/make
    {"url":"http://dashes.com/anil/","created_on":"2010-10-25T22:52:43.457Z","shorturl":"3EdUx6"}
    

We track hits (total hitcount as well as referrer and hit time) for each short URL. This information is available in both HTML and JSON formats.

This is a learning project, but I think that eventually it will be something you can add to an existing service and have it be useful.

## Dependencies

* Express.js (and Connect)
* Djangode (included)
* node-mongodb-native
* Log4js

## TODO:

* Formalize the [API](http://github.com/sivy/node-short/wiki/API)
* Refactor some parts of the app
* Collect more interesting stats
* Google Charts for stats
* Add a widget for "recently added URLs"
* Design. Oh my god, the plain HTML.
