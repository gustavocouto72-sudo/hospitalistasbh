'use client';

import { useState, useSyncExternalStore } from 'react';
import { chaveDoDia, dataDaChave, tipoDiaPadrao } from '@/calculo/tipo-dia';
import { ESTADO_INICIAL, escolherTipoDia, quadroDoDia, tipoDiaAtual } from './estado-dia';
import { QuadroPadrao } from './QuadroPadrao';
import { Topo } from './Topo';

// O site é estático: o dia de hoje só existe no aparelho. No HTML gerado no build ele é `null`, e o React
// troca pelo dia local logo ao abrir a página, sem erro de hidratação. O dia fica fixo enquanto a página está
// aberta, para o quadro não mudar sozinho à meia-noite.
const semAssinatura = () => () => undefined;
const chaveDeHoje = () => chaveDoDia(new Date());
const semDia = () => null;

export function Pagina() {
  const chave = useSyncExternalStore(semAssinatura, chaveDeHoje, semDia);
  const hoje = chave ? dataDaChave(chave) : null;
  const padrao = hoje ? tipoDiaPadrao(hoje) : null;

  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const tipoDia = tipoDiaAtual(estado, padrao);
  const quadro = quadroDoDia(tipoDia);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-12 sm:px-8">
      <Topo
        hoje={hoje}
        tipoDia={tipoDia}
        aoEscolher={(tipo) => setEstado((atual) => escolherTipoDia(atual, tipo, padrao))}
      />
      {quadro ? <QuadroPadrao quadro={quadro} /> : null}
    </main>
  );
}
