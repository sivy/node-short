var nbs = require('./NewBase60'),
    sys = require('sys');

var Db= require('mongodb/db').Db,
ObjectID= require('mongodb/bson/bson').ObjectID,
Server= require('mongodb/connection').Server;

UrlProvider = function (host, port, database){
    console.log(host, port, database);
    this.db = new Db(database, new Server(host, port, {auto_reconnect: true}, {}));
    this.db.open(function(){});
};

UrlProvider.prototype.getCollection = function(callback){
    this.db.collection('urls', function(error, urls_collection){
        if( error ) callback(error);
        else callback(null, urls_collection);
    });
};

UrlProvider.prototype.findAll = function (callback) {
    this.getCollection(function(error, urls_collection) {
        if( error ) callback(error)
        else {
            urls_collection.find(function(error, cursor) {
                if( error ) callback(error)
                else {
                    cursor.toArray(function(error, results) {
                        if( error ) callback(error)
                        else callback(null, results)
                    });
                }
            });
        }
    });
};

UrlProvider.prototype.findByShort = function(shorturl, callback) {
    this.getCollection(function(error, urls_collection) {
        if( error ) {
            callback(error)
        } else {
            urls_collection.findOne({shorturl: shorturl}, {}, function(error, result) {
                if( error ) callback(error)
                else callback(null, result)
            });
        }
    });
};

UrlProvider.prototype.save = function(urls, callback) {
    this.getCollection(function(error, urls_collection) {
        if( error ) {
            console.log(JSON.stringify(error.stack));
            callback(error)
        } else {
            if( typeof(urls.length)=="undefined")
                urls = [urls];

            for( var i =0;i< urls.length;i++ ) {
                url = urls[i];
                if (typeof(url.created_on)=='undefined') {
                    url.created_on = new Date();
                    var s = Math.pow(2,32);
                    var n = Math.floor(Math.random()*s);
                    url.shorturl = nbs.numtosxg(n);
                }
            }
            urls_collection.save(urls, function() {
                callback(null, urls);
            });
        }
    });
};
// TypeError: object is not a function
UrlProvider.prototype.update = function(url, update, callback) {
    this.getCollection(function(error, urls_collection) {
        if( error ) {
            callback(error);
        } else {
            // data.modified_on = new Date();
            console.log('updating url with ' + sys.inspect(update));
            urls_collection.update(
                { _id:url._id },
                update,
                { safe: true },
                function(error, url) {
                    if (error) {
                        console.log(error.message)
                        console.log(sys.inspect(url));
                        callback(error)
                    } else {
                        callback(null, url);
                    }
            });
        }
    });
};

exports.UrlProvider = UrlProvider;
