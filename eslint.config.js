import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/', '.next/', 'out/', 'next-env.d.ts', '.claude/', 'scripts/loop/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
