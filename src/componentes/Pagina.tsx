'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { chaveDoDia, dataDaChave, tipoDiaPadrao } from '@/calculo/tipo-dia';
import {
  ENTRADA_INICIAL,
  concluirLeitura,
  descartarContagens,
  iniciarLeitura,
  lerArquivo,
  postosDaFonte,
  preencherAMao,
} from './entrada';
import {
  ESTADO_INICIAL,
  ajustarContagem,
  ajustarMedicos,
  escolherTipoDia,
  quadroDoDia,
  tipoDiaAtual,
} from './estado-dia';
import { painelDoDia } from './painel-dia';
import { QuadroPadrao } from './QuadroPadrao';
import { QuadroSetores } from './QuadroSetores';
import { ResumoDia } from './ResumoDia';
import { SubirRelatorio } from './SubirRelatorio';
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

  // A fonte das contagens: o relatório subido ou o preenchimento à mão.
  const [entrada, setEntrada] = useState(ENTRADA_INICIAL);
  // Só a última leitura pedida vale: um arquivo lento não sobrescreve outro escolhido depois.
  const ultimaLeitura = useRef(0);

  async function escolherArquivo(arquivo: File) {
    const vez = ++ultimaLeitura.current;
    setEntrada((atual) => iniciarLeitura(atual, arquivo.name));
    const resultado = await lerArquivo(arquivo);
    if (vez !== ultimaLeitura.current) return;
    setEntrada((atual) => concluirLeitura(atual, resultado));
    if (resultado.tipo === 'relatorio') setEstado(descartarContagens);
  }

  function abrirAMao() {
    ultimaLeitura.current++;
    setEntrada(preencherAMao());
    setEstado(descartarContagens);
  }

  // Os números se refazem a cada render, sem botão "calcular".
  const { fonte } = entrada;
  const postos = postosDaFonte(fonte);
  const painel = tipoDia && fonte.tipo !== 'nenhuma' ? painelDoDia(postos, tipoDia, estado.ajustes) : null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-12 sm:px-8">
      <Topo
        hoje={hoje}
        tipoDia={tipoDia}
        aoEscolher={(tipo) => setEstado((atual) => escolherTipoDia(atual, tipo, padrao))}
      />
      <SubirRelatorio entrada={entrada} aoEscolherArquivo={escolherArquivo} aoPreencherAMao={abrirAMao} />
      {painel && fonte.tipo !== 'nenhuma' ? (
        <>
          <ResumoDia painel={painel} />
          <QuadroSetores
            painel={painel}
            postos={postos}
            ajustes={estado.ajustes}
            fonte={fonte.tipo}
            aoAjustarMedicos={(setor, semAjuste, sentido) =>
              setEstado((atual) => ajustarMedicos(atual, setor, semAjuste, sentido))
            }
            aoAjustarContagem={(posto, campo, valor) =>
              setEstado((atual) => ajustarContagem(atual, posto, campo, valor))
            }
          />
        </>
      ) : quadro ? (
        <QuadroPadrao quadro={quadro} />
      ) : null}
    </main>
  );
}
