const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

const path = require("path");
module.exports = {
  entry: "./dist/index.js",
  devtool: "source-map",

  output: {
    path: path.resolve(__dirname, "./"),
    filename: "./src/bundle.js",
  },
  devServer: {
    static: path.resolve(__dirname, "./"),
  },
  plugins: [
    new NodePolyfillPlugin()
  ]
};
