module.exports = {
  root: true,
  // Build output and test reports are generated — never lint them.
  ignorePatterns: [
    'node_modules/',
    '**/dist/',
    '**/coverage/',
    '**/playwright-report/',
    '**/test-results/',
  ],
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', 'react-hooks', 'jsx-a11y', 'import'],
  rules: {
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
      },
    ],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      // Both Vitest configs set `globals: true`.
      files: ['**/tests/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
      globals: {
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
      rules: {
        // vi.mock() calls are hoisted, so tests interleave them with imports.
        'import/order': 'off',
      },
    },
  ],
}