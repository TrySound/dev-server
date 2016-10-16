var token = require('./token.js');
var io = require('socket.io-client')();

io.on(token + '.reinject', function (blacklist) {
	reinjectLinks(new RegExp(blacklist));
});

io.on(token + '.reload', function () {
	reloadPage();
});

function reloadPage() {
	location.reload();
}

function reinjectLinks(blacklist) {
	var prev = [].slice.call(document.querySelectorAll('link')).filter(function (link) {
		var href = link.getAttribute('href');
		return (!blacklist || !blacklist.test(href)) && (!/^(\/\/|http)/.test(href) || /localhost/.test(href));
	});
	prev.forEach(function (link) {
		link.href = link.href.split('?')[0] + '?rev' + Date.now();
	});
}
