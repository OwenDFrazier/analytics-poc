var db = require('../services/db.js');

var GTM_ID = "GTM-P89H8H8";

function _renderIndex(response, status, dataLayer, loggedIn) {
	return response.render('pages/index', {
		status: status, 
		googleTagManagerId: GTM_ID, 
		dataLayer: dataLayer ? JSON.stringify(dataLayer) : undefined, 
		loggedIn: loggedIn,
		userId: dataLayer && dataLayer.userId ? dataLayer.userId : undefined
	});	
}

function register(app) {
	app.all('/', function(request, response) {
		var cookie = request.cookies.session_token;
		if (cookie === undefined) {
			return _renderIndex(response, "Not Logged In", undefined, false);
		}
		
		db.getSession(cookie, function (err, result) {
			console.log("getSession, err: " + err);
			if (err) {
				return response.status(500).send();
			} else if (result.rows.length === 0) {
				return _renderIndex(response, "Session not found", undefined, false);
			}
			console.log("getSession result on next line");
			console.log(result);
			return _renderIndex(response, "Logged In", {userId: result.rows[0].user_id}, true);
		});
	});

	app.post('/login', function(request, response) {
		console.log("login1")
		var userId = request.body.userId;
		var tokenHash = userId + "_tokenHash"; // unsecure, this is a POC
		console.log("login2, " + userId + ", " + tokenHash);

		db.getUser(userId, function (err, result) {
			if (err) {
				return response.status(500).send();
			} else if (result.rows.length === 0) {
				return _renderIndex(response, "User Not Found", undefined, false);
			}

			db.addSession(userId, tokenHash, function (err, result) {
				console.log("db.addSession, err: " + err);
				if (err) {
			        return response.status(500).send();
				}
				response.cookie('session_token', tokenHash, { maxAge: 900000, httpOnly: true });
				return _renderIndex(response, "Logged In", {event: "login", userId: userId}, true);
			});
		});
	});

	app.post('/signup', function(request, response) {
		console.log("signup")
		var userId = request.body.userId;
		var tokenHash = userId + "_tokenHash"; // unsecure, this is a POC
		console.log("signup, " + userId + ", " + tokenHash);

		db.getUser(userId, function (err, result) {
			console.log("getUser, err: " + err);
			console.log("result on next line");
			console.log(result);
			if (err) {
				return response.status(500).send();
			} else if (result.rows.length !== 0) {
				return _renderIndex(response, "User Already Exists", undefined, false);
			}

			db.addUser(userId, function(err, result) {
				if (err) {
					return response.status(500).send();
				}
				db.addSession(userId, tokenHash, function (err, result) {
					console.log("db.addSession, err: " + err);
					if (err) {
				        return response.status(500).send();
					}
					response.cookie('session_token', tokenHash, { maxAge: 900000, httpOnly: true });
					return _renderIndex(response, "Signup & Log In Successful!", {event: "signup", userId: userId}, true);
				});
			});
		});
	});

	app.post('/logout', function(request, response) {
		var cookie = request.cookies.session_token;
		if (cookie === undefined) {
			return _renderIndex(response, "Logout with no cookie..", undefined, false);
		}
		db.getSession(cookie, function (err, result) {
			if (err) {
				return _renderIndex(response, "Get session err: " + err, undefined, false);
			}
			db.deleteSession(cookie, function (err, result) {
				if (err) {
					return response.status(500).send();
				}
				response.clearCookie('session_token');
				return _renderIndex(response, "Log Out Successful!", {userId:null}, false);
			});
		});
	});

	app.post('/db-init', function (request, response) {
	    db.init(function (err) {
	    	if (err) {
				return response.status(500).send();
			}
	  	    return _renderIndex(response, "Database cleared!", undefined, false);
	    });
	});
}

exports.register = register;

