var Cheerio = require('cheerio');

var appHead = '<!DOCTYPE html.no-js(lang=\'en\')>' +
'<html>' +
	'<head>' +
		'<meta charset="utf-8"/>' +
		'<meta name="viewport" content="width=device-width, initial-scale=1.0"/>' +
		'<title>home</title>' +
		'<link rel="stylesheet" href="/css/app.css"/>' +
		'<script src="/js/libs/require.js"></script>' +
		'<script>' +
			'require([\'/js/app/config.js\'], function() {' +
				'require([\'/js/app/main.js\'])' +
			'});' +
		'</script>' +
	'</head>' +
	'<body>' +
		'<div id="app-root" style="display: none"></div>' +
	'</body>' +
'</html>';

var $ = Cheerio.load( appHead );

module.exports = $;