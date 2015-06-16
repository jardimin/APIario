# Node CORS

A simple Express middleware to send the proper Access Control Allow Origin headers for cross-domain requests.

## Configuration

No configuration is really necessary. Just pass it an array of URLs as strings. The URLs should be formatted including the protocol like: 'http://example.com'.

## Usage

Include the middleware in a folder in your application. These notes assume it's in the same directory as your app.js file.
Define a list of acceptable CORS URLs in an array in your app.js file.
```javascript
var allowedDomains = [
	'http://example.com'
	, 'http://foo.com'
	, 'http://www.bar.com'
];
```

Require the node-cors file and feed it the domains. The require will return a middleware function.
```javascript
var CORS = require('./node-cors/node-cors.js')(allowedDomains);
```

If you want to have all routes accept cross-origin requests, include the CORS middleware in your app configuration as such:
```javascript
app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(CORS);
	...
	...
});
```

If you'd only like to allow CORS on certain requests, you can do so by writing code similar to the following:
```javascript
// this is the area where you specify your routes
app.get('/api/allowableURL/:exvariable', CORS, function(req, res) {
	res.render('awesome-template-foo');
});
```