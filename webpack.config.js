const slsw = require("serverless-webpack");
const path = require("path");
module.exports = {
  mode: process.env.STAGE == "dev" ? "development" : "production",
  entry: slsw.lib.entries,
  // devtool: 'source-map',
  resolve: {
    modules: ["node_modules", path.resolve(__dirname, "src")],
    extensions: [".js", ".jsx", ".json", ".ts", ".tsx"]
  },
  output: {
    libraryTarget: "commonjs",
    path: path.join(__dirname, ".webpack"),
    filename: "[name].js"
  },
  target: "node",
  externals: ["aws-sdk"],
  module: {
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }]
  }
};
