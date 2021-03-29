// Got this from https://github.com/swagger-api/swagger-ui/blob/master/docs/samples/webpack-getting-started/webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const outputPath = path.resolve(__dirname, 'dist');

module.exports = {
  devServer: {
    port: 3000
  },
  mode: 'development',
  entry: {
    app: './src/index.js',
  },
  module: {
    rules: [
    //   {
    //     test: /\.json$/,
    //     use: [
    //       { loader: 'json-loader' }
    //     ]
    //   },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
        ]
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin({
      outputPath
    }),
    new CopyWebpackPlugin({
        patterns: [{
            // Copy the Swagger OAuth2 redirect file to the project root;
            // that file handles the OAuth2 redirect after authenticating the end-user.
            from: 'node_modules/swagger-ui/dist/oauth2-redirect.html',
            to: './',
        }]
      }
    ),
    new HtmlWebpackPlugin({
      template: 'index.html'
    })
  ],
  output: {
    filename: '[name].bundle.js',
    path: outputPath,
  }
};