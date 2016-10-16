const createServer = require('../');
const chokidar = require('chokidar');
const server = createServer({
	paths: __dirname
});

chokidar.watch('example/*.css').on('change', path => {
	console.log('change', path);
	server.reload({
		blacklist: 'vendor'
	});
});

chokidar.watch('example/*.html').on('change', path => {
	console.log('change', path);
	server.reload();
});
