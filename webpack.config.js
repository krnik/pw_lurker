const path = require('path');

module.exports = {
  mode: 'development',
  entry: './inject/main.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{
            loader: 'ts-loader',
            options: {
                configFile: path.resolve(__dirname, 'tsconfig.inject.json'),
            },
        }],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: 'inject.js',
    path: path.resolve('./dist'),
  },
};
