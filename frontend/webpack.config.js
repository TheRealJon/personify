const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin')

const config = {

}

module.exports = {
  mode: 'development',
  devtool: "source-map",
  resolve: {
      extensions: [".ts", ".tsx", ".js", ".json"]
  },
  module: {
      rules: [
          {
            test: /\.tsx?$/,
            loader: "awesome-typescript-loader"
          },
          {
            enforce: "pre",
            test: /\.js$/,
            loader: "source-map-loader"
          },
          {
            test: /\.less$/,
            loader: 'less-loader'
          },
      ]
  },
  plugins: [
    new CopyWebpackPlugin(['./src/index.html'])
  ],
  externals: {
      "react": "React",
      "react-dom": "ReactDOM"
  }
};
