const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

// module.exports = {
//   webpack: {
//     plugins: {
//       add: [
//         new NodePolyfillPlugin() /* this plugin will be prepended */,
//       ],
//     },
//   }
// };

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      return {
        ...webpackConfig,
        resolve: {
          ...webpackConfig.resolve,
          fallback: {
            "console": require.resolve("console-browserify")
          }
        },
        plugins: [
          ...webpackConfig.plugins,
          new NodePolyfillPlugin()
        ]
      };
    }
  }
};