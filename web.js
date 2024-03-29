var fs = require('fs');
var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser')

var app = express();

app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

app.set('port', (process.env.PORT || 5000));
app.set('views', __dirname);
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

require('./index').register(app)

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});