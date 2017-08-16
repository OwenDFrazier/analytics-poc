var db = require('./db.js');

var GTM_ID = process.env.GTM_ID || "GTM-P89H8H8";
var COOKIE_NAME = 'session_token';

function _renderIndex(response, status, dataLayer, loggedIn) {
	return response.render('index', {
		status: status, 
		googleTagManagerId: GTM_ID,
		dataLayer: dataLayer ? JSON.stringify(dataLayer) : undefined, 
		loggedIn: loggedIn,
		userId: dataLayer && dataLayer.userId ? dataLayer.userId : undefined
	});	
}

function _ajaxResponse(response, status, dataLayer, loggedIn) {
	return response.send({
		status: status, 
		dataLayer: dataLayer ? JSON.stringify(dataLayer) : undefined, 
		loggedIn: loggedIn,
		userId: dataLayer && dataLayer.userId ? dataLayer.userId : undefined
	});	
}

function _errorResponse(response, err) {
	return response.status(500).send(err);
}

function index(request, response) {
	console.log("index");
	var cookie = request.cookies.session_token;
	if (cookie === undefined) {
		return _renderIndex(response, "Not Logged In", undefined, false);
	}
	
	db.getSession(cookie, function (err, result) {
		if (err) {
			return _errorResponse(response, err);
		} else if (result.rows.length === 0) {
			return _ajaxResponse(response, "Session not found", undefined, false);
		}
		return _renderIndex(response, "Logged In", {userId: result.rows[0].user_id}, true);
	});
}

function login(request, response) {
	console.log("login");
	var userId = request.query.userId;
	var tokenHash = userId + "_tokenHash"; // unsecure, this is a POC

	db.getUser(userId, function (err, result) {
		if (err) {
			return _errorResponse(response, err);
		} else if (result.rows.length === 0) {
			return _ajaxResponse(response, "User Not Found", undefined, false);
		}

		db.addSession(userId, tokenHash, function (err, result) {
			if (err) {
		        return _errorResponse(response, err);
			}
			response.cookie('session_token', tokenHash, { maxAge: 900000, httpOnly: true });
			return _ajaxResponse(response, "Logged In", {event: "login", userId: userId}, true);
		});
	});
}

function signup(request, response) {
	console.log("signup")
	var userId = request.query.userId;
	var tokenHash = userId + "_tokenHash"; // unsecure, this is a POC

	db.getUser(userId, function (err, result) {
		if (err) {
			return _errorResponse(response, err);
		} else if (result.rows.length !== 0) {
			return _ajaxResponse(response, "User Already Exists", undefined, false);
		}

		db.addUser(userId, function(err, result) {
			if (err) {
				return _errorResponse(response, err);
			}
			db.addSession(userId, tokenHash, function (err, result) {
				if (err) {
			        return _errorResponse(response, err);
				}
				response.cookie(COOKIE_NAME, tokenHash, { maxAge: 900000, httpOnly: true });
				return _ajaxResponse(response, "Signup & Log In Successful!", {event: "signup", userId: userId}, true);
			});
		});
	});
}

function logout(request, response) {
	var cookie = request.cookies.session_token;
	if (cookie === undefined) {
		return _ajaxResponse(response, "Logout with no cookie..", undefined, false);
	}
	db.getSession(cookie, function (err, result) {
		if (err) {
			return _ajaxResponse(response, "Get session err: " + err, undefined, false);
		}
		db.deleteSession(cookie, function (err, result) {
			if (err) {
				return _errorResponse(response, err);
			}
			response.clearCookie(COOKIE_NAME);
			return _ajaxResponse(response, "Log Out Successful!", {userId:null}, false);
		});
	});
}

function dbInit(request, response) {
	db.init(function (err) {
    	if (err) {
			return _errorResponse(response, err);
		}
  	    return _ajaxResponse(response, "Database cleared!", undefined, false);
    });
}

function register(app) {
	app.all('/', function(request, response) {
		index(request, response);
	});

	app.get('/login', function(request, response) {
		login(request, response);
	});

	app.get('/signup', function(request, response) {
		signup(request, response);
	});

	app.get('/logout', function(request, response) {
		logout(request, response);
	});

	app.get('/db-init', function (request, response) {
	    dbInit(request, response);
	});
}

exports.register = register;

