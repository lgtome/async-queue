export default (config, env, helpers, options) => {
  config.node.console = true
  config.node.process = true
  config.output.publicPath = './'
}
