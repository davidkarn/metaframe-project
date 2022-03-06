const webpack = require('webpack')
const path = require('path');

module.exports = {
    mode: 'development',
    entry: {options:    path.resolve(__dirname, './src/index.js'),
	          content:    path.resolve(__dirname, './src/content.js'),
	          controller: path.resolve(__dirname, './src/controller.js'),
	          popup:      path.resolve(__dirname, './src/popup.js'),
	          background: path.resolve(__dirname, './src/background.js'),
	          iframe:     path.resolve(__dirname, './src/iframe.js')},
    module: {
	      rules: [
	          {
		            test:    /\.(js|jsx)$/,
		            exclude: /node_modules/,
		            use:     ['babel-loader'],
	          },
	          {
                test:  /\.(css)$/,
                use:   ['style-loader','css-loader']
            },
	      ],
    },
    resolve: {
	      fallback:   {"stream": require.resolve("stream-browserify")},
	      extensions: ['*', '.js', '.jsx'],
    },
    output: {
	      path:     path.resolve(__dirname, './public'),
	      filename: '[name].bundle.js',
    },
    devServer: {
	      contentBase: path.resolve(__dirname, './public'),
    },
    devtool: 'source-map',
    optimization: {
        minimize: false
    },
    plugins: [
	      // fix "process is not defined" error:
	      // (do "npm install process" before running the build)
	      new webpack.ProvidePlugin({
	          process: 'process/browser',
	      }),
    ],
};
