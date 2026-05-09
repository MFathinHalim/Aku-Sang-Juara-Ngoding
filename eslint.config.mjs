import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    files: ['**/*.rules'],
    plugins: {
      firebase: firebaseRulesPlugin
    },
    processor: 'firebase/rules'
  },
  {
    ignores: ['dist/**/*', 'node_modules/**/*', '.next/**/*']
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
