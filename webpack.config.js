const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin') // for md and php
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsWebpackPlugin = require( 'optimize-css-assets-webpack-plugin' );
const TerserWebpackPlugin = require( 'terser-webpack-plugin' );


const isDev = process.env.NODE_ENV === 'development';

const optimization = () => {
    const config =  {
        splitChunks: {
            chunks: 'all'
        }
    }

    if (!isDev) {
        config.minimize = true;
        config.minimizer = [
            new OptimizeCssAssetsWebpackPlugin(),
            new TerserWebpackPlugin()
        ];
    }
    
    return config;
};

const jsLoaders = () => {
    const loaders = [{
        loader: 'babel-loader',
        options: {
            presets: [
                '@babel/preset-env'
            ],
            plugins: [
                '@babel/plugin-proposal-class-properties'
            ]
        }
    }];
    
    if ( isDev ) {
        loaders.push('eslint-loader');
    }
    
    return loaders;
}



module.exports = {
    context: path.resolve( __dirname, 'src' ),
    mode: 'development',
    entry: ['@babel/polyfill', path.resolve(__dirname, 'src')+'/forms.js'],
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        }
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HTMLWebpackPlugin({
            template: path.resolve(__dirname, 'src')+'/index.html',
            minify: {
                collapseWhitespace: !isDev
            }
        }),
        new CopyWebpackPlugin([
          {
              from: path.resolve(__dirname, 'src/forms/*'),
              to: path.resolve(__dirname, 'dist')
          },
          {
              from: path.resolve(__dirname, 'src/lists/*'),
              to: path.resolve(__dirname, 'dist')
          },
          {
              from: path.resolve(__dirname, 'src/readme.md'),
              to: path.resolve(__dirname, 'dist')
          },
          {
              from: path.resolve(__dirname, 'src/post.php'),
              to: path.resolve(__dirname, 'dist')
          }
        ]),
        new MiniCssExtractPlugin({
            filename: '[name].css'
        }),
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: ['/node_modules/', '/tmp/'],
                use: jsLoaders()
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader
                    },
                    'css-loader'
                ]
            },
        ],
    },
    optimization: optimization()
}
