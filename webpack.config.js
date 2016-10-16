const webpack = require('webpack');

module.exports = {
	entry: './client.js',
	output: {
		filename: 'client.bundle.js'
	},
	plugins: [
		new webpack.optimize.UglifyJsPlugin
	]
};
