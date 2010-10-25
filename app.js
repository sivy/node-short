
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
    app.use(express.staticProvider(__dirname + '/static'));
    app.use(app.router);
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

/*
 * LOGGING SUPPORT
 */
var log4js = require('log4js');
log4js.addAppender(log4js.consoleAppender(), 'app');
log4js.addAppender(log4js.consoleAppender(), 'resolved');
log4js.addAppender(log4js.consoleAppender(), 'defer_queue');

app_log = log4js.getLogger('app');
app_log.setLevel('TRACE');

resolved_log = log4js.getLogger('resolved');
resolved_log.setLevel('TRACE');

defer_log = log4js.getLogger('defer_queue');
defer_log.setLevel('TRACE');

// error handling
function handleError(error, res) {
    app_log.error(error.message);
    app_log.debug(JSON.stringify(error));

    res.contentType('text/plain');
    res.send(error.message);
    res.end();
}

var urlProvider = new UrlProvider(
    settings.db.host, 
    settings.db.port, 
    settings.db.database
);

// Routes

app.get('/', function(req, res){
    urlProvider.findAll(function(error, urls){
        var ctx = { urls: urls };
        loader.load('index.html', function (error, t) {
            if (error)
                handleError(error, res);
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
            handleError(error, res);
        } else {
            var url = urls[0];
            app_emitter.emit('newUrl', url);
            app_log.debug('url saved');
            if (format == 'json') {
                res.contentType('application/json');
                res.send(JSON.stringify(url));
                res.end();
            }
            loader.load('saved.'+format, function (error, t) {
                app_log.trace('template loaded');
                t.render({url:url}, function (error, result) {
                    app_log.trace('rendering: ' + result);
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
            handleError(error, ers);
        } else {
            var hit = { created_on: new Date() };
            if (req.headers.referer) {
                hit.referer = req.headers.referer;
            }
            app_log.info('hit:' + JSON.stringify(hit));
            
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
    app_log.info('data for shorturl: ' + shorturl);
    urlProvider.findByShort(shorturl, function(error, url){        
        if (error) {
            handleError(error, ers);
        } else {
            app_log.debug(JSON.stringify(url));
            
            res.contentType('application/json');
            res.send(JSON.stringify(url));
            res.end();
        }
    });
});

app.get('/:shorturl.html', function(req, res){
    var shorturl = req.params.shorturl;
    urlProvider.findByShort(shorturl, function(error, url) {        
        if (error) {
            handleError(error, ers);
        } else {
            app_log.debug(JSON.stringify(url));
            
            loader.load('urlinfo.html', function (error, t) {
                app_log.trace('template loaded');
                t.render({url:url}, function (error, result) {
                    if (error) {
                        console.log(JSON.stringify(error));
                    }
                    app_log.trace('rendering: ' + result);
                    res.contentType('text.html');
                    res.send(result);
                    res.end();
                });
            }); 
        }
    });
});

/**
 * longpoll handling for dashboard
 */
var resolved=[];
var resolved_deferred=[];

app.get('/data/resolved', function(req, res) {
    app_log.trace('data/resolved @ ' + new Date());
    defer_log.debug('processing recent clicks');
    res.contentType('text/plain');
    if (resolved.length) {
        defer_log.debug('returning ' + resolved.length + ' items');
        var resp = JSON.stringify({ next_offset: offset+resolved.length, msgs: resolved.slice(offset) });
        defer_log.trace(resp);
        res.send(resp);
        res.end();
    } else {
        defer_log.debug('no pending urls; deferring request');
        resolved_deferred.push( res );
    }
});

/**
 update stats for the URL
 */
app_emitter.on('newHit', function(url, hit){
    console.log('hit for url: ' + JSON.stringify(url));
    
    
    // update stats for url
    var data = { "$push": { "stats.hits": hit }, "$inc": { "stats.hitcounter": 1 } };
    urlProvider.findByShort(url.shorturl, function(error, url){
        urlProvider.update({_id:url._id}, data, function(error, data){
            console.log('updated url '+ url.shorturl +' with hit data: ' + JSON.stringify(data));
        });
    });

    // for dashboard
    delete url.stats;
    var msg = { url: url, hit: hit };
    
    resolved.push(msg);
    resolved_log.trace('resolved queue' + JSON.stringify(resolved));
    for( ix in resolved_deferred ){
        var res = resolved_deferred[ix];
        defer_log.trace('sending deferred response # '+ix + ' ' + JSON.stringify({ msgs: resolved }));
        res.send( JSON.stringify({ msgs: resolved }) );
    }
    
    // now purge the deferrals
    resolved_log.trace('clearing resolved queue');
    resolved = [];
    
    defer_log.trace('clearing defer queue');
    resolved_deferred = []

});

app_emitter.on('newUrl', function(url){
    console.log('new URL! ' + url.url + ' shorturl: ' + url.shorturl);
});

// Only listen on $ node app.js

if (!module.parent) {
    app.listen(3000);
    console.log("Express server listening on port %d", app.address().port)
}
