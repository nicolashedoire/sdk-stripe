import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'server/index': 'src/server/index.ts',
      'client/index': 'src/client/index.ts',
      'server/webhooks/index': 'src/server/webhooks/index.ts',
      'next/index': 'src/next/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom', 'next', 'stripe', '@stripe/stripe-js', '@stripe/react-stripe-js'],
    treeshake: true,
  },
]);
