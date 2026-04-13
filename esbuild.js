const esbuild = require('esbuild');
const path = require('path');

const isWatch = process.argv.includes('--watch');
const isProduction = process.argv.includes('--production');

const commonOptions = {
  bundle: true,
  minify: isProduction,
  sourcemap: !isProduction,
  logLevel: 'info',
};

const extensionConfig = {
  ...commonOptions,
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/extension.js',
  format: 'cjs',
  platform: 'node',
  external: ['vscode'],
};

const webviewConfig = {
  ...commonOptions,
  entryPoints: ['webview/main.tsx'],
  outfile: 'dist/webview.js',
  format: 'esm',
  platform: 'browser',
  jsx: 'automatic',
  define: {
    'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
  },
};

async function build() {
  if (isWatch) {
    const extCtx = await esbuild.context(extensionConfig);
    const webCtx = await esbuild.context(webviewConfig);
    await extCtx.watch();
    await webCtx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(extensionConfig);
    await esbuild.build(webviewConfig);
  }
}

build().catch(() => process.exit(1));
