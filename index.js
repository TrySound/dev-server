const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const inject = require('connect-injector');
const portscanner = require('portscanner');
const fs = require('fs');
const chalk = require('chalk');
const opn = require('opn');

const token = require('./token.js');
const client = fs.readFileSync(__dirname + '/client.bundle.js', 'utf-8');

function formatMessage(message) {
    const line = Array(message.length + 5).join('-');
    return `${line}\n  ${message}\n${line}`;
}

function createServer(options) {
    if (!options) {
        options = {};
    }
    const paths = typeof options.paths === 'string' ? [options.paths] : options.paths;
    const middleware = options.middleware || [];
    const minPort = options.minPort || 3000;
    const maxPort = options.maxPort || minPort + 10;
    const browser = typeof options.open === 'string' ? { app: options.open } : null;

    const app = express();
    const server = http.Server(app);
    const io = socketIO(server);

    app.get(`/${token}.client.js`, (req, res) => {
        res.set('Content-Type', 'text/javascript');
        res.send(client);
    });

    app.use(inject(injectWhen, injectConverter));

    function injectWhen(req, res) {
        const ha = req.headers.accept;
        return ha && ha.indexOf("html") !== -1;
    }

    function injectConverter(content, req, res, cb) {
        const string = content.toString();
        const match = string.match(/<\/body>(?![\s\S]*<\/body>)/i);
        if (match) {
            cb(null, [
                string.slice(0, match.index),
                `<script src="/${token}.client.js"></script>`,
                string.slice(match.index)
            ].join('\n'));
        } else {
            cb(null, content);
        }
    }

    paths.forEach(item => app.use(express.static(item)));

    middleware.forEach(item => app.use(md));

    const promise = new Promise((resolve, reject) => {
        portscanner.findAPortNotInUse(minPort, maxPort, {}, (err, port) => {
            if (err) {
                reject(err);
            } else {
                resolve(port);
            }
        });
    }).then(port => {
        return new Promise((resolve, reject) => {
            const host = 'http://localhost:' + port;
            server.listen(port, function (err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(formatMessage('Started local server on ' + chalk.green(host)));
                    resolve(host);
                }
            });
        });
    }).then(host => {
        if (browser) {
            return opn(host, browser).catch(err => console.error(err.toString()));
        }
    });

    function reload(options) {
        options = options || {};
        if (options.reinject) {
            io.emit(token + '.reinject', options.blacklist);
        } else {
            io.emit(token + '.reload');
        }
    };

    return {
        promise,
        reload
    };
}

module.exports = createServer;
