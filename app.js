
/**
 * Module dependencies.
 */

var express = require('express');
var app = module.exports = express.createServer();
var EventEmitter = require('events').EventEmitter;

var app_emitter = new EventEmitter();

// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.use(express.bodyDecoder());
    app.use(express.cookieDecoder());
    app.use(express.session());
    app.use(express.methodOverride());
    app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
    app.use(app.router);
    app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
    app.use(express.errorHandler()); 
});

var settings = require('./settings'),
    UrlProvider = require('./urlprovider-mongo').UrlProvider,
//    UserProvider = require('./urlprovider-memory').UserProvider,
    sys = require('sys'),
    template = require('./template/template'),
    loader = require('./template/loader'),
    admin = require('./admin');

loader.set_path(settings.template_path);

var urlProvider = new UrlProvider('localhost', 27017, 'nd-urls');

// Routes

app.get('/', function(req, res){
    urlProvider.findAll(function(error, urls){
        var ctx = { urls: urls };
        loader.load('index.html', function (error, t) {
            if (error.message)
                res.send(error.message)
            else {
                t.render(ctx, function (error, result) {
                    res.send(result);
                    res.end();
                });
            }
        });
    });
});

app.get('/new', function(req, res){
    var ctx = { title: "Make Short" };
   
    loader.load('new.html', function (error, t) {
           t.render(ctx, function (error, result) {
                res.send(result);
                res.end();
            });
        });
});


app.post('/make', function(req, res){
    var url = req.body.url;
    var format = req.body.format || 'html'; // can be json
    var u = {
        url: url,
    };
    urlProvider.save([u], function(error, urls) {
        if (error) {
            res.contentType('text/plain');
            res.send(error.message);
            res.send(JSON.stringify(error));
            res.end();
        } else {
            var url = urls[0];
            app_emitter.emit('newUrl', url);
            console.log('saved');
            if (format == 'json') {
                res.contentType('application/json');
                res.send(JSON.stringify(url));
                res.end();
            }
            loader.load('saved.'+format, function (error, t) {
                console.log('template loaded');
                t.render({url:url}, function (error, result) {
                    console.log('rendering: ' + result);
                    res.contentType('saved.'+format);
                    res.send(result);
                    res.end();
                });
            }); 
        }
    });
});

app.get('/:shorturl', function (req, res){
    var shorturl = req.params.shorturl;
    urlProvider.findByShort(shorturl, function(error, url){
        if (error) {
            console.log(JSON.stringify(error));
            res.contentType('text/plain');
            res.send(error.message);
            res.send(JSON.stringify(error));
            res.end();
        } else {
            var hit = { created_on: new Date() };
            if (req.headers.referer) {
                hit.referer = req.headers.referer;
            }
            console.log('hit:' + sys.inspect(hit));
            
            // let the rest of the app know we have a hit!
            app_emitter.emit('newHit', url, hit);
            res.send(JSON.stringify(url));
//            res.redirect(url.url, 302);
            res.end();                   
        }
    });
});

app.get('/:shorturl.json', function (req, res){
    var shorturl = req.params.shorturl;
    console.log(sys.inspect(shorturl));
    urlProvider.findByShort(shorturl, function(error, url){        
        if (error) {
            console.log(JSON.stringify(error));
            res.contentType('text/plain');
            res.send(error.message);
            res.send(JSON.stringify(error));
            res.end();
        } else {
            console.log(sys.inspect(url));
            
            res.contentType('text/plain');
            res.send(JSON.stringify(url));
            res.end();
        }
    });
});

app.get('/:shorturl.html', function(req, res){
    var shorturl = req.params.shorturl;
    urlProvider.findByShort(shorturl, function(error, url) {        
        if (error) {
            console.log(JSON.stringify(error));
            res.contentType('text/plain');
            res.send(error.message);
            res.send(JSON.stringify(error));
            res.end();
        } else {
            console.log(sys.inspect(url));
            
            loader.load('urlinfo.html', function (error, t) {
                console.log('template loaded');
                t.render({url:url}, function (error, result) {
                    if (error) {
                        console.log(JSON.stringify(error));
                    }
                    console.log('rendering: ' + result);
                    res.contentType('text.html');
                    res.send(result);
                    res.end();
                });
            }); 
        }
    });
});

/**
 update stats for the URL
 */
app_emitter.on('newHit', function(url, hit){
    var data = { "$push": { "stats.hits": hit }, "$inc": { "stats.hitcounter": 1 } };
    console.log('hit for url: ' + JSON.stringify(url));
    urlProvider.findByShort(url.shorturl, function(error, url){
        urlProvider.update({_id:url._id}, data, function(error, data){
            console.log('updated url with hit data: ' + JSON.stringify(data));
            console.log(JSON.stringify(url));
        });
    });
    
});

app_emitter.on('newUrl', function(url){
    console.log('new URL! ' + url.url + ' shorturl: ' + url.shorturl);
});

// Only listen on $ node app.js

if (!module.parent) {
    app.listen(3000);
    console.log("Express server listening on port %d", app.address().port)
}
