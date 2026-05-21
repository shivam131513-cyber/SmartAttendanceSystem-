module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix for face-api.js trying to import Node.js built-ins (fs, path, os, crypto)
      // in a browser environment. Webpack 5 requires explicit fallback configuration.
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
      return webpackConfig;
    },
  },
};
