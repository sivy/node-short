/*
  url = {
      _id: <id>,
      url: <string>,
      shorturl: <string>,
      stats: {
          hit_count: <int>,
          hits: [
              {
                  created_on: <date>
                  referer: <string>
              }
          ]
      }
  }
*/

var nbs = require('./NewBase60'),
    sys = require('sys');

var urlCounter=1;

UrlProvider = function (){};
UrlProvider.prototype.dummyData = [];

UrlProvider.prototype.findAll = function (callback) {
    callback(null, this.dummyData);
};

UrlProvider.prototype.findByUrl = function(url, callback) {
    var result = null;
    for(var i=0; i<this.dummyData.length;i++) {
        if (this.dummyData[i].url == url) {
            result = this.dummyData[i];
            break;
        }
    }
    callback(null, result);
};

UrlProvider.prototype.findByShort = function(shorturl, callback) {
    var result = null;
    for(var i=0; i<this.dummyData.length;i++) {
        console.log("checking "+sys.inspect(this.dummyData[i])+ " for " + shorturl);
        if (this.dummyData[i].shorturl == shorturl) {
            result = this.dummyData[i];
            break;
        }
    }
    callback(null, result);
};

UrlProvider.prototype.findRecent = function(count, callback) {
    var result = [];
    result = this.dummyData.slice(-count);
    callback(null, result);
};

UrlProvider.prototype.save = function(urls, callback) {
    var url = null;
    
    if (typeof (urls.length)=="undefined") {
        urls = [urls];
    }

    for (var i=0; i<urls.length; i++) {
        url = urls[i];
        url._id = urlCounter++;
        url.created_on = new Date();
        var s = Math.pow(2,32);
        var n = Math.floor(Math.random()*s);
        url.shorturl = nbs.numtosxg(n);
        this.dummyData[this.dummyData.length] = url;
    }
    callback(null, urls);
};

UrlProvider.prototype.update = function (shorturl, data, callback) {
    for(var i=0; i<this.dummyData.length;i++) {
        if (this.dummyData[i].shorturl == shorturl) {
            this.dummyData[i] = data;
            break;
        }
    }
    callback(null, result);
};

new UrlProvider().save([
    { url: "http://monkinetic.com" },
    { url: "http://scripting.com" },
    { url: "http://github.com" },
], function(error, favs){});

exports.UrlProvider = UrlProvider;

/**
  userprovider
*/

/*
  user = {
      _id: <id>,
      dateCreated: <date>,
      username: <string>,
      password_hash: <string>,
      reminder: <string>
  }
*/

var crypto = require('crypto');

var userCounter=1;

UserProvider = function (){};
UserProvider.prototype.dummyData = [];

UserProvider.prototype.findAll = function (callback) {
    callback(null, this.dummyData);
};

UserProvider.prototype.findById = function(id, callback) {
    var result = null;
    for(var i=0; i<this.dummyData.length;i++) {
        if (this.dummyData[i]._id == id) {
            result = this.dummyData[i];
            break;
        }
    }
    callback(null, result);
};

UserProvider.prototype.findByName = function(name, callback) {
    var result = null;
    for(var i=0; i<this.dummyData.length;i++) {
        if (this.dummyData[i].username == name) {
            result = this.dummyData[i];
            break;
        }
    }
    callback(null, result);
};

UserProvider.prototype.save = function(users, callback) {
    var user = null;
    
    if (typeof (users.length)=="undefined") {
        users = [users];
    }

    for (var i=0; i<users.length; i++) {
        user = users[i];
        user._id = userCounter++; // since mongo is not giving us an id here
        user.dateCreated = new Date();
        this.dummyData[this.dummyData.length] = user;
    }
    callback(null, users);
};

new UserProvider().save([
    {
        username: 'sivy', 
        password_hash:crypto.createHash('md5').update('test').digest("hex"),
        reminder: 'test',
        
    },
], function(error, favs){});

exports.UserProvider = UserProvider;