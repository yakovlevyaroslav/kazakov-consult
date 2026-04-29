const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

/**
 * @param {unknown} _env
 * @param {{ mode?: string }} argv
 */
module.exports = (_env, argv) => {
  const isProd = argv.mode === "production";

  return {
    mode: isProd ? "production" : "development",
    entry: {
      bootstrap: "./src/bootstrap.js",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProd ? "js/[name].[contenthash:8].js" : "js/[name].js",
      clean: true,
    },
    devtool: isProd ? false : "eval-cheap-module-source-map",
    devServer: {
      port: 8080,
      hot: true,
      open: true,
      proxy: [
        {
          context: ["/api"],
          target: "http://localhost:3000",
        },
      ],
      static: {
        directory: path.resolve(__dirname, "public"),
      },
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            isProd ? MiniCssExtractPlugin.loader : "style-loader",
            {
              loader: "css-loader",
              options: {
                sourceMap: !isProd,
              },
            },
          ],
        },
        {
          test: /\.scss$/i,
          use: [
            isProd ? MiniCssExtractPlugin.loader : "style-loader",
            {
              loader: "css-loader",
              options: {
                sourceMap: !isProd,
              },
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: !isProd,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html",
        minify: isProd
          ? {
              collapseWhitespace: true,
              keepClosingSlash: true,
              removeComments: true,
              removeRedundantAttributes: true,
              removeScriptTypeAttributes: true,
              removeStyleLinkTypeAttributes: true,
              useShortDoctype: true,
            }
          : false,
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "public"),
            to: path.resolve(__dirname, "dist"),
            noErrorOnMissing: true,
          },
        ],
      }),
      ...(isProd
        ? [
            new MiniCssExtractPlugin({
              filename: "css/[name].[contenthash:8].css",
            }),
          ]
        : []),
    ],
    optimization: {
      minimize: isProd,
      splitChunks: {
        chunks: "all",
      },
      minimizer: isProd ? ["...", new CssMinimizerPlugin()] : [],
    },
  };
};
