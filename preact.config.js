export default {
  webpack(config, env, helpers, options) {
    config.node.console = true
    config.node.process = true
    if (!env.isServer) {
      config.entry['public-bundle'] = path.resolve(
        __dirname,
        'public-page.entry.js',
      )
      for (const {
        plugin: { options },
      } of helpers.getPluginsByName(config, 'HtmlWebpackPlugin')) {
        if (options.url === '/account') {
          options.chunks = ['bundle', 'polyfills']
          options.template = `!!ejs-loader?esModule=false!${path.resolve(
            __dirname,
            './src/app-template.ejs',
          )}`
        } else {
          options.chunks = ['public-bundle', 'polyfills']
          options.template = `!!ejs-loader?esModule=false!${path.resolve(
            __dirname,
            './src/public-template.ejs',
          )}`
        }
      }
    }
  },
}
