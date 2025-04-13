import path from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: path.resolve(__dirname, 'src/index.ts'),
    cli: path.resolve(__dirname, 'src/cli.ts'),
  },
  dts: { entry: { index: path.resolve(__dirname, 'src/index.ts') } },
  target: 'es2020',
  clean: true,
  format: 'esm',
  minify: true,
  treeshake: true,
  splitting: false,
});
