const currentTask = process.env.npm_lifecycle_event
const path = require('path')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const MiniCssExractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const fse = require('fs-extra')

const postCSSPlugins = [
  require('postcss-import'),
  require('postcss-mixins'),
  require('postcss-simple-vars'),
  require('postcss-nested'),
  require('postcss-hexrgba'),
  require('autoprefixer')
]

class RunAfterCompile {
  apply(compiler) {
    compiler.hooks.done.tap('Copy images', function() {
      fse.copySync('./app/assets/images', './docs/assets/images')
    })
  }
}

let cssConfig =  {
  test: /\.css$/i,
  use: ['css-loader', {loader: 'postcss-loader', options: {postcssOptions: {plugins: postCSSPlugins}}}]
}

let pages = fse.readdirSync('./app').filter(function(file) {
  return file.endsWith('.html')
}).map(function(page) {
  return new HtmlWebpackPlugin({
    filename: page,
    template: `./app/${page}`
  })
})

let config = {
  entry: './app/assets/scripts/App.js',
  plugins: pages,
  module: {
    rules: [
     cssConfig
    ]
  }
}
if (currentTask == 'dev') {
  cssConfig.use.unshift('style-loader')
  config.output = {
    filename: 'bundled.js',
    path: path.resolve(__dirname, 'app')
  }
  config.devServer = {
    static: {
      directory: path.resolve(__dirname, 'app')
    },
    port: 3000,
    open: true,
    hot: true,
    compress: true,
    historyApiFallback: true
  }
  config.mode = 'development'
}

if (currentTask == 'build') {
  config.module.rules.push({
    test: /\.js$/,
    exclude: /(node_modules)/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env']
      }
    }
  })
  cssConfig.use.unshift(MiniCssExractPlugin.loader)
  postCSSPlugins.push(require('cssnano'))
  config.output = {
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js',
    path: path.resolve(__dirname, 'docs')
  }
  config.mode = 'production'
  config.optimization = {
    splitChunks: {
      chunks: 'all'
    }
  }
  config.plugins.push(
    new CleanWebpackPlugin(), 
    new MiniCssExractPlugin({filename: 'styles.[chunkhash].css'}),
    new RunAfterCompile()
    )
}

module.exports = config