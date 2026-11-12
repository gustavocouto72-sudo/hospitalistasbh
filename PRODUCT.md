# Product

<!-- impeccable:product-schema 1 -->

> Escrito sem entrevista com o dono: a sessão que o gerou (T-05.1) roda no loop, sem canal de pergunta.
> Tudo aqui vem de `docs/prd.md` e `docs/specs/SPEC-05-interface/spec.md`. O que é inferência está
> marcado como **(inferido)**. O dono revisa ao fim do loop.

## Platform

web

## Users

- **Hospitalista ou coordenador do dia:** sobe o relatório 9998 do TASY, confere os médicos de cada
  setor, lê a sugestão de apoio e imprime ou gera o PDF. Faz isso uma vez por dia, de manhã, muitas vezes
  pelo celular, entre uma tarefa e outra do plantão **(inferido do PRD §3 e da SPEC-05)**.
- **Equipe:** recebe a folha impressa ou o PDF e só lê.

## Product Purpose

Calculadora que divide a carga de pacientes entre os hospitalistas de forma simétrica. Mostra a carga por
médico em cada setor contra a média do dia, num semáforo de cinco cores, e sugere o mínimo de leitos de
apoio entre setores. Sucesso: do relatório subido até a sugestão pronta em menos de 1 minuto, e a equipe
trocar a planilha pelo site.

## Positioning

A geografia vem antes: o apoio é exceção, com o menor número de frases e de leitos. O cálculo é
determinístico e auditável (mesma entrada, mesma saída), e nada sai do navegador.

## Operating Context

- Relatório 9998 exportado do TASY (`.xls`, `.csv` ou `.xlsx`), só com contagens por posto.
- Quadro de setores fixo por tipo de dia (dia de semana ou fim de semana), editável no dia em passos de 0,5
  médico.
- Uso em celular de 360 px e em computador do hospital; saída impressa ou em PDF **(inferido: ambiente de
  enfermaria e sala de médicos, com luz fluorescente forte)**.

## Capabilities and Constraints

- Calculadora, não sistema: sem login, banco de dados ou histórico. Recarregar zera tudo.
- Nada sai do navegador: sem analytics, scripts de terceiros nem envio do relatório.
- Tudo editável e recalculado na hora, sem botão "calcular".
- Next.js estático na Vercel, TypeScript, Tailwind e Zod. Textos em português em `src/textos/`.
- Termos do domínio: posto, setor, carga, apoio, semáforo, potenciais admissões, escala própria (3.1 na
  semana).

## Brand Commitments

- Semáforo de cinco cores fixado no PRD §6.3: azul escuro, azul claro, verde, amarelo, vermelho. A cor
  nunca é a única pista: cada setor mostra número e rótulo.
- Azul escuro e azul claro não podem ser confundidos com o verde por quem é daltônico.
- Não há nome comercial, logotipo nem marca além do título "Divisão de carga dos hospitalistas".

## Evidence on Hand

- Só fixtures sintéticas em `test/fixtures/`. Nunca nomes de médicos ou pacientes, porque o repositório é
  público.

## Product Principles

1. Calculadora, não sistema.
2. Nada sai do navegador.
3. Mesma entrada, mesma saída.
4. A geografia vem antes.
5. Tudo editável.

## Accessibility & Inclusion

- Contraste AA em todo texto e nas cinco cores do semáforo.
- Semáforo legível por daltônicos (protanopia, deuteranopia e tritanopia), sempre com número e rótulo.
- Navegação inteira por teclado e rótulos ARIA nos botões − e +.
