const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

/**
 * @param {unknown} _env
 * @param {{ mode?: string }} argv
 */
module.exports = (_env, argv) => {
  const isProd = argv.mode === "production";

  return {
    mode: isProd ? "production" : "development",
    entry: "./src/main.js",
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
    },
    module: {
      rules: [
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
      minimizer: isProd ? ["...", new CssMinimizerPlugin()] : [],
    },
  };
};
