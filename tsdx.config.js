const replace = require('@rollup/plugin-replace');

module.exports = {
  rollup(config, opts) {
    if (opts.format === 'esm') {
      config = { ...config, preserveModules: true };
      config.output = {
        ...config.output,
        dir: 'dist/',
        entryFileNames: '[name].mjs',
      };
      delete config.output.file;
    }

    // https://github.com/formium/tsdx/issues/981
    // fix preventAssignment warning from @rollup/plugin-replace
    config.plugins = config.plugins.map((p) =>
      p.name === 'replace'
        ? replace({
            'process.env.NODE_ENV': JSON.stringify(opts.env),
            preventAssignment: true,
          })
        : p
    );
    return config;
  },
};
