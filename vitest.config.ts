import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Maps your spec config to the runtime engine
  plugins: [],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.spec.ts', 'projects/**/*.spec.ts'],
    reporters: ['html', 'default'],
    outputFile: './coverage/test-coverage',
    mockReset: true,
    typecheck: {
      tsconfig: './tsconfig.spec.json',
    },
    coverage: {
      provider: 'v8',
      include: [
        'projects/**/*.ts',
        '!**/*.module.ts',
        '!**/main.ts',
        '!**/environment.ts',
        '!**/environment.development.ts',
        '!**/*.pb.ts',
        '!**/*.pbconf.ts',
        '!**/*.pbsc.ts',
      ],
    },
  },
});
