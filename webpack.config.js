const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const autoprefixer = require('autoprefixer');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
	entry: {
		main: './sources/client/index.tsx',
	},
	output: {
		filename: '[name].js',
		chunkFilename: '[name].js',
		path: path.resolve(__dirname, 'dist', 'client'),
	},
	watch: isDevelopment,
	watchOptions: isDevelopment ? {
  		poll: true,
  		ignored: /node_modules/
	} : undefined,
	mode: isDevelopment ? 'development' : 'production',
	devtool: isDevelopment && "source-map",
	devServer: {
		historyApiFallback: true,
		port: 3000,
		open: true
	},
	resolve: {
		extensions: ['.js', '.json', '.ts', '.tsx'],
	},

	node: {
		fs: "empty"
	},

	optimization: {
		minimizer: [
			new UglifyJsPlugin({
				uglifyOptions: {
					output: {
						comments: false
					},
					ie8: false,
					toplevel: true
				}
			})
		],
		splitChunks: {
			//chunks: 'all',
			automaticNameDelimiter: '-',

			cacheGroups: {
				styles: {
					name: 'styles',
					test: /\.s?css$/,
					chunks: 'all',
					// minChunks: 1,
					priority: -1,
					reuseExistingChunk: true,
					enforce: true,
				}
			}
		}
	},

	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				loader: 'ts-loader',
				//loader: 'awesome-typescript-loader',
			},
			{ 
				test: /\.handlebars$/, 
				loader: "handlebars-loader" 
			},
			{
				test: /\.(scss|css)$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: "css-loader",
						options: {
							sourceMap: isDevelopment,
							//minimize: !isDevelopment
						}
					},
					{
						loader: "postcss-loader",
						options: {
							autoprefixer: {
								browsers: 'last 2 versions, > 1%'
							},
							sourceMap: isDevelopment,
							plugins: () => [
								autoprefixer
							]
						},
					},
					{
						loader: 'fast-sass-loader',
						options: {}
					}
				]
			},
			{
				test: /\.(jpe?g|png|gif|svg|ttf)$/,
				use: [
					{
						loader: "file-loader",
						options: {
							name: '[name].[ext]',
							outputPath: 'static/',
							useRelativePath: true,
						}
					},
					{
						loader: 'image-webpack-loader',
						options: {
							mozjpeg: {
								progressive: true,
								quality: 90
							},
							optipng: {
								enabled: true,
							},
							pngquant: {
								quality: '80-90',
								speed: 4
							},
							gifsicle: {
								interlaced: false,
							},
							/*webp: {
								quality: 75
							}*/
						}
					}
				]
			},
			{
				test: /\.(fs|vs|glsl|txt)$/i,
				use: 'raw-loader',
			}
		],
	},

	plugins: [
		new webpack.DefinePlugin({//TODO - try change to _UPDATE_TIME_ instead _GLOBALS_ container
			_GLOBALS_: JSON.stringify({
				update_time: Date.now(),
			}),
			_CLIENT_: true
		}),
		new CaseSensitivePathsPlugin(),
		new MiniCssExtractPlugin({
			filename: "[name]-styles.css",
			chunkFilename: "[id].css"
		}),
		new HtmlWebpackPlugin({
			hash: isDevelopment,
			favicon: './sources/client/img/icons/icon.png',
			title: 'BertaSnakes',
			minify: !isDevelopment,
			template: './sources/client/index.html',
			filename: './index.html'
		})
	]
};
