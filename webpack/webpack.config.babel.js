import webpack from 'webpack';
import path    from 'path';
import del     from 'del';
import fs      from 'fs';
import yargs   from 'yargs';

import HtmlWebpackPlugin     from 'html-webpack-plugin';
import ExtractTextPlugin     from 'extract-text-webpack-plugin';
import CopyPlugin            from 'copy-webpack-plugin';
import NgAnnotatePlugin      from 'ng-annotate-webpack-plugin';

let args = yargs.argv;
let options = {
  env:   args.e || 'dev',
  watch: !!args.w
};

let localHelper = {
  isProd(){
    return options.env === 'prod';
  }
};

let paths = {
  root:   path.resolve(__dirname, '../'),
  src:    path.resolve(__dirname, '../app/'),
  vendor: path.resolve(__dirname, '../node_modules'),
  build:  path.resolve(__dirname, '../build'),
  config: path.resolve(__dirname, '../config'),
};

let baseConfig = {
  watch: options.watch,
  cache: true,
  devServer: {
    host: 'react.dev',
    port: '3001',
    contentBase: paths.build,
    publicPath: '/',
    colors: true,
    displayErrorDetails: true,
    /* for HMR only */
    hot: true,
    inline: true,
    historyApiFallback: true
  }
};

let baseEntryConfig = {
  context: paths.src
};

// loaders
let loaders = {
  babel:  {
    test:    /\.js$/,
    exclude: /node_modules/,
    loader:  'babel',
    query:   {
      stage: 0
    }
  },
  json: {
    test:    /\.json/,
    exclude: /node_modules/,
    loader:  'json'
  },
  html: {
    test:    /\.html$/,
    exclude: /node_modules/,
    loader:  'raw'
  },
  sass: {
    test:    /\.scss$/,
    exclude: /node_modules/,
    loader:  localHelper.isProd() ? ExtractTextPlugin.extract('style', `css!sass!resolve-url`) : 'style!css!sass' /* for HMR */
  },
  fonts: [
    {
      test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url?limit=10000&mimetype=application/font-woff&prefix=fonts&name=font.[hash].[ext]'
    }, {
      test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url?limit=10000&mimetype=application/octet-stream&prefix=fonts&name=font.[hash].[ext]'
    }, {
      test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url?limit=10000&mimetype=application/vnd.ms-fontobject&prefix=fonts&name=font.[hash].[ext]'
    }, {
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      loader: 'url?limit=10000&mimetype=image/svg+xml&prefix=fonts&name=font.[hash].[ext]'
    }
  ],
  images: {
    dev:
    [{
      test: /\.(jpe?g|png|gif|svg)$/i,
      loaders: [
        'file?hash=sha512&digest=hex&name=image.[hash].[ext]',
        'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
      ]
    }, { test: /\.(jpe?g|png|gif|svg)$/i, loader: 'url-loader?limit=100000' }
    ],
    // Using pngquant
    prod: {
      test: /.*\.(gif|png|jpe?g|svg)$/i,
      loaders: [
        'file?hash=sha512&digest=hex&name=image.[hash].[ext]',
        'image-webpack?{progressive:true, optimizationLevel: 7, interlaced: false, pngquant:{quality: "65-90", speed: 4}}'
      ]
    }
  },
};

let plugins = {

  html: (entryPath) => {
    return new HtmlWebpackPlugin({
      path:     path.join(paths.build, entryPath),
      inject:   'body',
      template: path.join(paths.src, 'index.html'),
      filename: 'index.html',
      chunks:   ['vendors', 'app']
    })
  },

  css: () => {
    return new ExtractTextPlugin('style.[chunkhash].css', {
      allChunks: true
    });
  },

  commonChunks: () => {
    return new webpack.optimize.CommonsChunkPlugin({
      name: 'vendors',
      filename: 'vendors.[hash].js',
      minChunks: (module, count) => {
        return module.resource && module.resource.indexOf('node_modules') !== -1 && count >= 1;
      }
    });
  },

  copy: (from, to) => {
    return new CopyPlugin([{
      from: from,
      to:   to
    }])
  },

  ngAnnotate: () => {
    return new NgAnnotatePlugin();
  },

  hotReplacement: () => {
    return new webpack.HotModuleReplacementPlugin();
  },

  sourceMap: (path) => {
    return new webpack.SourceMapDevToolPlugin({
      filename: '[file].map',
      append: `\n//# sourceMappingURL=${path}[url]`
    })
  },

  provide: () => {
    return new webpack.ProvidePlugin({
      React: 'react',
      ReactDom: 'react-dom'
    });
  }

};

// resolves
let resolve = {
  modulesDirectories: [ 'node_modules' ]
};

let entryPoints = {
  entry: {
    app:       [
      //'webpack/hot/dev-server',
      './app.js'
    ]
  },
  module: {
    loaders: [
      loaders.babel,
      loaders.html,
      loaders.json,
      loaders.sass,
      loaders.fonts,
      localHelper.isProd() ? loaders.images.prod : loaders.images.dev
    ],
  },
  resolve: resolve,
  output: {
    path:       path.join(paths.build, '/'),
    //publicPath: options['public-path'] ? `/${options['public-path']}/` : '/',
    publicPath: options['public-path'] ? `/${options['public-path']}/` : '/',
    filename:   '[name].[chunkhash].js'
  },
  plugins: [
    plugins.html('/'),
    plugins.commonChunks(),
    plugins.copy('./assets', './assets'),
    plugins.ngAnnotate(),
    plugins.hotReplacement(),
    plugins.provide()
  ]
};

if (localHelper.isProd()) {
  entryPoints.plugins.push(plugins.css());
}

// merging result
let mergedConfig = [];

entryPoints.plugins.push(plugins.sourceMap(entryPoints.output.publicPath));

// add apps as entry points to webpack output
export default Object.assign(entryPoints, baseEntryConfig, baseConfig);

///////////////////////////////////

