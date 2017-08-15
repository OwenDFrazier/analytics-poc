
var _ = require('underscore');

function register(app) {
	var routeModules = ['index'];
	_.each(routeModules, function (routeModule) {
		require('./'+routeModule).register(app);
	})
}

exports.register = register;

