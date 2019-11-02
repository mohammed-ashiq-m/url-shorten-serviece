var express = require('express');
var bodyParser = require('body-parser');
var bases = require('bases');
var url = require('url');
var app = express();
var Db = require('mongodb').Db,
    Server = require('mongodb').Server;
app.use(express.static(__dirname + '/public', {
    maxAge: 20
}));

app.use(bodyParser.urlencoded({
    extended: false
}));

var db = new Db('test', new Server('localhost', 27017));
// Establish connection to db
db.open(function(err, db) {
    if(err)console.log(err);
    db.createCollection('url_db', function(err) {
        if(err)console.log(err);
    });
});
app.post('/request', function(req, res) {
    var link = req.body.link;
    var parseurl = url.parse(link).pathname.slice(1);
    var hostname = url.parse(link).hostname;


    var collection = db.collection('url_db');
    //collection.remove();
    if (hostname == "localhost") {
        collection.find({
            "s_url": parseurl
        }).toArray(function(err, item) {
            if(err)console.log(err);
            //console.log(item.length);
            if (item.length == 1) {
                res.send(item[0].l_url);
            } else {
                res.send("URL not found");
            }
        });
    } else {
        collection.count(function(err, count) {
            if(err)console.log(err);
            collection.find({
                "l_url": link
            }).toArray(function(err, item) {
                if(err)console.log(err);
                if (item.length == 1) {
                    res.send("Already Created <br/> http://localhost:3000/" + item[0].s_url);
                } else {
                    var num = 479890;
                    var s_url_digits = Number(num) + Number(count);
                    //console.log(s_url_digits);
                    var shorturl = bases.toBase36(s_url_digits);

                    var doc1 = {
                        "s_url": shorturl,
                        "l_url": link,
                        "visits": 0
                    };
                    collection.insert(doc1);
                    res.send("http://localhost:3000/" + shorturl);
                }
            });

        });
    }
});
app.route("/:url").all(function(req, res) {
    var req_url = req.params.url;
    var collection = db.collection('url_db');
    collection.find({
        "s_url": req_url
    }).toArray(function(err, item) {
        if(err)console.log(err);
        if (item.length == 1) {
            var visits=Number(item[0].visits);
            collection.update({"s_url": req_url,"visits":visits}, {$set:{"s_url": req_url,"visits":visits+1}});
            res.status(301);
            res.setHeader("Cache-Control", "no-cache");
            res.set("Location", item[0].l_url);
            res.send();
        } else {
            res.send("URL not found");
        }
    });
});
app.get('/result/urls', function(req,res) {
    console.log("Ajax Request"+req.url);
    var collection = db.collection('url_db');
    collection.find({}).sort({"visits":-1}).limit(10).toArray(function(err,data){
        if(err) console.log(err);
        res.send(data);
    });
});
app.listen(3000);