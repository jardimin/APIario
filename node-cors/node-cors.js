function allowCrossDomain(domainArray) {

	function corsRequestHandler(req, res, next) {
		var allowedDomains = domainArray;
		if(allowedDomains.indexOf(req.headers.origin) != -1) {

			var theOrigin = req.headers.origin;
			res.header('Access-Control-Allow-Origin', theOrigin);
		}

		// Some complex CORS requests require an OPTIONS request first. Make sure it works.
		if ('OPTIONS' == req.method) {
			res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
			res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
			res.send(200);
		}
		else {
			next();
		}
	}

	return corsRequestHandler;
}

module.exports = allowCrossDomain;