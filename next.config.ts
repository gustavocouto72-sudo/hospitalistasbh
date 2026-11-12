import type { NextConfig } from 'next';

const configuracao: NextConfig = {
  // Site estático: sem servidor nem rotas de API, nada sai do navegador.
  output: 'export',
  poweredByHeader: false,
};

export default configuracao;
