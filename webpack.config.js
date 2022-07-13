const path = require('path');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  {
    mode: 'production',
    entry: './public/style/index.scss', //['./public/style/index.scss', './public/index.ts'],
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist/public')
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/html/index.html'
      })
    ],
    module: {
      rules: [
        // ts-loader seems to break the typescript compilation so that the DOMContentLoaded handler is executed twice
        // {
        //   test: /\.ts$/,
        //   use: [
        //     {
        //       loader: 'ts-loader',
        //       options: { configFile: 'tsconfig.browser.json' }
        //     }
        //   ],
        //   exclude: /node_modules/
        // },
        {
          test: /\.scss$/,
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
                  plugins: [autoprefixer()]
                }
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sassOptions: {
                  includePaths: ['./node_modules']
                },
                implementation: require('sass'),
                webpackImporter: false
              }
            }
          ]
        }
      ]
    }
  }
];
