import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/', '.next/', 'out/', 'next-env.d.ts', '.claude/', 'scripts/loop/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Por último: desliga as regras de formatação, que ficam com o Prettier.
  { name: 'eslint-config-prettier', ...prettier },
);
