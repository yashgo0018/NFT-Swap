const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.js('resources/js/index.js', 'public/js')
  .react()
  .css('resources/css/app.css', 'public/css')
  .webpackConfig({
    resolve: {
      fallback: {
        os: require.resolve("os-browserify/browser"),
        https: require.resolve("https-browserify"),
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        http: require.resolve("stream-http")
      }
    }
  });
