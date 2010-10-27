# node-short, a url-shortener service based on node.js

`node-short` is a basic url shortener written in javascript for node.js, using some jquery front-end fun bits and mongodb for url storage. New URLs can be added via a form or via a basic API:

    dawnrider:node-short sivy$ curl --data "url=http://dashes.com/anil/&format=json" localhost:3000/make
    {"url":"http://dashes.com/anil/","created_on":"2010-10-25T22:52:43.457Z","shorturl":"3EdUx6"}
    

We track hits (total hitcount as well as referrer and hit time) for each short URL. This information is available in both HTML and JSON formats.

This is a learning project, but I think that eventually it will be something you can add to an existing service and have it be useful.

## Dependencies

* expressjs (and Connect)
* Djangode (included)
* node-mongodb-native
* log4js

## TODO:

* formalize the API
* refactor some parts of the app
* collect more interesting stats
* google charts for stats
* add a widget for "recently added urls"
* design. oh my god, the plain HTML.
