const path = require('path');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  {
    mode: 'production',
    entry: ['./public/style/index.css', './public/index.tsx'],
    devtool: 'source-map',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist/public')
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js']
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/html/index.html'
      })
    ],
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: [
            {
              loader: 'ts-loader',
              options: { configFile: 'tsconfig.browser.json' }
            }
          ],
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'index.css'
              }
            },
            { loader: 'extract-loader' },
            { loader: 'css-loader' },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [require('@tailwindcss/postcss'), require('autoprefixer')]
                }
              }
            }
          ]
        },
        {
          test: /\.json$/,
          type: 'asset/resource'
        }
      ]
    }
  }
];
