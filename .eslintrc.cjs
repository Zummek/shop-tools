module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    // By extending from a plugin config, we can get recommended rules without having to add them manually.
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/warnings',
    'plugin:import/errors',
    'plugin:import/typescript',
    'plugin:react-hooks/recommended',
    // This disables the formatting rules in ESLint that Prettier is going to be responsible for handling.
    // Make sure it's always the last config, so it gets the chance to override other configs.
    'eslint-config-prettier',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  settings: {
    react: {
      // Tells eslint-plugin-react to automatically detect the version of React to use.
      version: 'detect',
    },
    // Tells eslint how to resolve imports
    'import/resolver': {
      'eslint-import-resolver-custom-alias': {
        alias: {
          '@/tests': './tests',
          '@': './src',
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      },
    },
  },
  plugins: ['react-refresh'],
  rules: {
    quotes: ['error', 'single'],
    'no-console': 'error',
    'object-shorthand': ['error', 'always'],
    'react/display-name': 'off',
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
    'import/newline-after-import': 'error',
    'no-duplicate-imports': 'error',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    curly: ['error', 'multi-or-nest', 'consistent'],
    'react/jsx-curly-brace-presence': [
      'warn',
      { props: 'never', children: 'always' },
    ],
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'import/order': [
      'error',
      {
        groups: [
          ['external', 'builtin'],
          'internal',
          'parent',
          ['index', 'sibling'],
          'object',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          // caseInsensitive: true,
        },
        pathGroups: [
          {
            pattern: '@/**',
            group: 'internal',
          },
        ],
      },
    ],
  },
};
