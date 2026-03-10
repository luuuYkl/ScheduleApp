// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';
import pluginVue from 'eslint-plugin-vue';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.config.*',
      'coverage/',
      '!.vite/'
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.vue'],
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
    // @ts-ignore
    languageOptions: {
      // @ts-ignore
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname
      }
    }
  // @ts-ignore
  },
  {
    rules: {
      // Vue 相关规则
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      
      // TypeScript 相关规则
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      
      // 浏览器环境全局变量
      'no-undef': 'off',
      
      // 通用规则
      'no-console': 'off',
      'no-debugger': 'off',
      'prefer-const': 'off',
      'no-var': 'off',
      'no-constant-binary-expression': 'off',
      'no-case-declarations': 'off'
    }
  }
);