var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver');


var app = express();

//view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "1234"))
var session = driver.session()




// Home page
app.get('/', function(req, res){
    session
        .run("MATCH (n: Treatment) RETURN n")
        .then(function(result){
            var tArr = [];
            
            result.records.forEach(function(record){
                //console.log(record._fields[0]);
                tArr.push({
                    id: record._fields[0].identity.low,
                    name: record._fields[0].properties.name
                });

            });

            session
                .run("MATCH (d: Disease) RETURN d")
                .then(function(result2){
                    var dArr = [];
                    result2.records.forEach(function(record){
                        //console.log(record._fields[0]);
                        dArr.push({
                            id: record._fields[0].identity.low,
                            name: record._fields[0].properties.name
                        });
        
                    });
                    res.render('index', {
                        disease : dArr,
                        treatment : tArr
                    });
                })
        })
        .catch(function(error){
            console.log(error)
        });

});

//Add Treatment
app.post('/treatment/add', function(req, res){
    var name = req.body.name;
    
    session
        .run("CREATE(n:Treatment {name:{nameParam}}) RETURN n.name", {nameParam: name})
        .then(function(result){
            res.redirect('/');
            //session.close();
        })
        .catch(function(error){
            console.log(error);
        });
});

//Add Disease
app.post('/disease/add', function(req, res){
    var dname = req.body.name;
    
    session
        .run("CREATE(n:Disease {name:{nameParam}}) RETURN n.name", {nameParam: dname})
        .then(function(result){
            res.redirect('/');
            //session.close();
        })
        .catch(function(error){
            console.log(error);
        });
});

//Add Relationship
app.post('/relationship/add', function(req, res){
    var name1 = req.body.name1;
    var name2 = req.body.name2;
    
    session
        .run("match (d:Disease {name: {nameParam1}}) , (t:Treatment {name: {nameParam2}}) merge(d)-[r:Treated_By]->(t)", {nameParam1: name1, nameParam2: name2})
        .then(function(result){
            res.redirect('/');
            //session.close();
        })
        .catch(function(error){
            console.log(error);
        });
});

// Disease Details
app.get('/dis/:id', function(req, res){
    var id = req.params.id;
    res.send(id);
});


// Treatment Details
app.get('/disease/:id', function(req, res){
    var id = req.params.id;
    
    session
    .run("OPTIONAL MATCH (a:Disease)-[r:Treated_By]-(b:Treatment) WHERE id(a)=toInt({idParam}) RETURN b", {idParam:id})
        .then(function(result){
            var tlArray = [];


            result.records.forEach(function(record){
                if(record._fields[0] != null){
                    tlArray.push({
                        id: record._fields[0].identity.low,
                        name: record._fields[0].properties.name
                    });
                }
            });

            res.render('disease', {
                id: id,
                tl: tlArray
            })
        })
        .catch(function(error){
            console.log(error)
        });
});

app.listen(3000);

console.log('Server started on port 3000');

module.exports = app;