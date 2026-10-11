import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import angularPlugin from '@angular-eslint/eslint-plugin';
import templateParser from '@angular-eslint/template-parser';
import templatePlugin from '@angular-eslint/eslint-plugin-template';

// Проверки корректности не зависят от прежней конфигурации TSLint и правил оформления
export default [
    { ignores: ['dist/**', 'node_modules/**', '.cache/**', 'coverage/**'] },
    {
        files: ['**/*.ts'],
        languageOptions: { parser: tsParser },
        plugins: { '@typescript-eslint': tsPlugin, '@angular-eslint': angularPlugin },
        rules: {
            'constructor-super': 'error',
            'eqeqeq': ['error', 'smart'],
            'no-cond-assign': 'error',
            'no-debugger': 'error',
            'no-dupe-else-if': 'error',
            'no-duplicate-case': 'error',
            'no-fallthrough': 'error',
            'no-new-wrappers': 'error',
            'no-unsafe-finally': 'error',
            'no-unreachable': 'error',
            'valid-typeof': 'error',
            '@typescript-eslint/no-misused-new': 'error',
            '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
            '@angular-eslint/use-lifecycle-interface': 'error',
            '@angular-eslint/use-pipe-transform-interface': 'error'
        }
    },
    {
        files: ['**/*.html'],
        languageOptions: { parser: templateParser },
        plugins: { '@angular-eslint/template': templatePlugin },
        rules: {
            '@angular-eslint/template/eqeqeq': 'error',
            '@angular-eslint/template/no-duplicate-attributes': 'error',
            '@angular-eslint/template/no-negated-async': 'error'
        }
    }
];
