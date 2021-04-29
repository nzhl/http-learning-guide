const replace = require('@rollup/plugin-replace');
const copy = require('rollup-plugin-copy');

module.exports = {
  rollup(config, opts) {
    config.output = {
      ...config.output,
      dir: 'dist/',
      entryFileNames: '[name].mjs',
    };
    delete config.output.file;
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

    // assets copy
    config.plugins.push(
      copy({
        targets: [
          {
            src: 'src/**/*.html',
            dest: 'dist',
          },
        ],
      })
    );
    return config;
  },
};
