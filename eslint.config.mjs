import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  js.configs.recommended,
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // TypeScript 관련 규칙 완화
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      
      // React Hook 규칙 완화
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      
      // Next.js 이미지 최적화 경고 완화
      '@next/next/no-img-element': 'warn',
      
      // React 이스케이프 규칙 완화
      'react/no-unescaped-entities': 'warn',
      
      // 기타 규칙 완화
      '@typescript-eslint/no-unused-expressions': 'warn',
      'prefer-const': 'warn'
    },
  },
];
