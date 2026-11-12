import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

// calculo/ e relatorio/ são puros: sem React, Next nem interface, para testar isolados.
const mensagemDaFronteira = 'calculo/ e relatorio/ são puros e não importam React, Next nem componentes/.';

export default tseslint.config(
  { ignores: ['**/node_modules/', '.next/', 'out/', 'next-env.d.ts', '.claude/', 'scripts/loop/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: 'fronteira-pura',
    files: ['src/calculo/**', 'src/relatorio/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*', 'next', 'next/*'],
              message: mensagemDaFronteira,
            },
            {
              group: ['@/componentes', '@/componentes/*', '**/componentes', '**/componentes/*'],
              message: mensagemDaFronteira,
            },
          ],
        },
      ],
    },
  },
  // Por último: desliga as regras de formatação, que ficam com o Prettier.
  { name: 'eslint-config-prettier', ...prettier },
);
