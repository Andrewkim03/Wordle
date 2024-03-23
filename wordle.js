// https://nodejs.org/api/n-api.html
// https://blog.postman.com/how-to-create-a-rest-api-with-node-js-and-express/
// https://developer.mozilla.org/en-US/docs/Web
// https://developer.mozilla.org/en-US/docs/Web/JavaScript

var port = 8670;
var express = require('express');
var crypto = require('crypto');
var app = express();
const fs = require('fs');
const database = {};
const Wordle = require('./model')

// https://scotch.io/tutorials/use-expressjs-to-get-url-and-post-parameters
app.use(express.json()); // support json encoded bodies
app.use(express.urlencoded({ extended: true })); // support encoded bodies

// https://expressjs.com/en/starter/static-files.html
app.use(express.static('static-content')); 

//retrieve all wordles
app.get('/api/wordle/', function(req, res) {
	res.status(200);
	res.json(database);
});

app.get('/api/wordle/words/', function(req, res) {
    fs.readFile('./static-content/words.5', 'utf8', (err, data) => {
        if (err) {
            res.status(500)
            res.json({ error: 'Internal Server Error' });
            return;
        }
        res.send(data);
    });
});

//creating a new user and a wordle instance 
app.post('/api/wordle/userName/', function (req, res) {
	var words = req.body.words;
	var wordle = new Wordle(words);
	var userName = wordle.username;
	// console.log(JSON.stringify(req.body));
	if(userName in database){
		res.status(409);
		res.json({"error": `${userName} is already in the database`});
		return;
	}
	database[userName]=wordle;
	res.status(200);
	res.json({"userName": userName});
});


//start a new game with an existing username 
app.put('/api/wordle/newgame/', function (req, res) {
	var userName = req.body.userName;
	//console.log(database);
	if(!(userName in database)){
		res.status(404);
		res.json({"error": `${userName} is not in database`});
		return;
	}
	var wordle = database[userName];
	wordle.reset();
	res.status(200);
	res.json({"userName": userName});
});


//update guess and return the result, # won, # lost 
app.put('/api/wordle/guess/', function (req, res) {
	var userName = req.body.userName;
	var guess = req.body.guess;
	if(!(userName in database)){
		res.status(404);
		res.json({"error": `${userName} is not in database`});
		return;
	}
	var wordle = database[userName];
	//console.log(wordle);
	var data = wordle.makeGuess(guess);
	res.status(200);
	res.json({"data" : data, "won" : wordle.won, "lost" : wordle.lost});
	//console.log(database)
});

app.listen(port, function () {
	console.log('Example app listening on port ' + port);
});



