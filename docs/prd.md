# PRD — Divisão de carga dos hospitalistas

> Versão 0.2, 12/11/2026. Decisões do questionário de alinhamento já incorporadas. O que ainda depende do relatório real do TASY está marcado como **[PENDENTE]**.

## 1. Resumo

Calculadora web, aberta e sem login, publicada na Vercel. A equipe sobe o relatório do TASY com as contagens de cada setor e o site mostra na hora:

- a carga por médico em cada setor, comparada à média do dia num semáforo de cinco cores;
- quais setores devem apoiar quais, e com quantos leitos, para deixar a divisão simétrica.

Nenhum dado fica guardado.

## 2. Problema

- Trabalham ao mesmo tempo **17 ou 18 hospitalistas**, distribuídos em **9 setores** por alocação geográfica.
- A ocupação varia muito de um dia para o outro. Um setor com 2,5 médicos pode ter só 10 pacientes, enquanto outro, com 2 médicos, tem 20.
- Pacientes da **cardiologia** e da **geriatria** são acompanhados por essas equipes e não entram na carga dos hospitalistas.
- Hoje a divisão sai de uma planilha que nunca funcionou bem. Isso gera assimetria e sobrecarga.

## 3. Objetivos e métricas de sucesso

| Objetivo | Métrica |
|---|---|
| Divisão simétrica | Setores no verde (até ±1,5 paciente por médico em relação à média), antes e depois do apoio |
| Pouca quebra geográfica | Número de frases de apoio e de leitos de apoio sugeridos |
| Decisão rápida | Do relatório subido até a sugestão pronta, em menos de 1 minuto |
| Adoção | A equipe usa o site na divisão diária no lugar da planilha |

## 4. Princípios de produto

1. **Calculadora, não sistema.** Não há login, banco de dados nem histórico.
2. **Nada sai do navegador.** O relatório traz só contagens por setor, sem nomes. Mesmo assim, ele é lido e calculado no próprio aparelho.
3. **Mesma entrada, mesma saída.** O cálculo é determinístico e auditável, como no HelmCare.
4. **A geografia vem antes.** O apoio é exceção: o sistema usa o mínimo de frases e de leitos de apoio.
5. **Tudo editável.** A equipe corrige qualquer número e o cálculo se refaz na hora.

## 5. Usuários

- **Hospitalista ou coordenador do dia:** sobe o relatório, confere os médicos, lê a sugestão e imprime ou gera o PDF.
- **Equipe:** recebe o PDF ou a folha impressa.

## 6. Capacidades

### 6.1 Importação do relatório do TASY

- A equipe sobe o arquivo "relatório 9998" exportado do TASY. O formato está no Anexo A.
- Para cada posto, o sistema usa só as quatro primeiras colunas:

| Coluna do relatório | O que é | Peso na carga |
|---|---|---|
| `Ds posto` | Posto de enfermagem, por exemplo "Unidade de Internação Posto 2 - 4º PAV", que vira o código **4.2** | — |
| `Qt hospitalistas` | Pacientes a cargo dos hospitalistas: qualquer especialidade, exceto cardiologia e geriatria | 1 (é a carga) |
| `Qt cardio geriatria` | Pacientes da cardiologia e da geriatria | 0; só informação |
| `Qt potenciais admissoes` | Pacientes no nome dos coordenadores. **Já estão dentro de `Qt hospitalistas`** | Só indicador, com destaque visual |

- As colunas de pacientes por médico e de fatores que vêm no relatório são **ignoradas**. O site calcula tudo com o seu próprio quadro de médicos (6.2), porque os fatores do relatório não batem com os combinados (Anexo A).
- A linha "Total" é ignorada e recalculada.
- As admissões servem para a equipe ver quantos pacientes novos há em cada setor e ficar atenta a eles. Por enquanto não pesam mais. Um peso extra pode entrar no futuro, mas fica fora desta versão.
- Todos os números ficam editáveis na tela. Se faltar um setor, a equipe digita os números à mão.

### 6.2 Quadro de médicos por setor

**Termos.** O **posto** é a unidade do relatório, como 4.2. O **setor** é a unidade de trabalho dos hospitalistas: um ou mais postos com uma equipe só. A conta de carga, o semáforo e o apoio são sempre **por setor**. O agrupamento de postos em setores muda conforme o tipo de dia.

- No topo do site há uma escolha entre **dia de semana** e **fim de semana**. Cada opção tem um quadro padrão de setores e médicos, fixado no código e editável no dia.

**Dia de semana: 9 setores, 18 médicos**

| Setor | Postos | Médicos |
|---|---|---|
| 2º andar | 2.1 + 2.2 | 3 |
| 3.1 | 3.1 | Escala de cobertura própria (ver abaixo) |
| 4.2 | 4.2 (+ 4.1) | 2,5 |
| 4.3 | 4.3 | 2 |
| 4.4 | 4.4 | 2 |
| 4.5 | 4.5 | 2 |
| 6.1 | 6.1 | 1,5 |
| 6.2 | 6.2 | 2,5 |
| 6.3 | 6.3 | 2,5 |

- **3.1 no dia de semana:** não tem médico fixo. Os pacientes, de curta permanência, são cobertos por uma escala específica, fora do escopo desta versão. O site mostra o 3.1 à parte, com as contagens, e o tira da média, do semáforo e da sugestão de apoio.

**Fim de semana: 8 setores, 8 médicos**

| Setor | Postos | Médicos |
|---|---|---|
| 2º andar | 2.1 + 2.2 | 1 |
| 3.1 + 6.1 | 3.1 + 6.1 | 1 |
| 4.2 | 4.2 (+ 4.1) | 1 |
| 4.3 | 4.3 | 1 |
| 4.4 | 4.4 | 1 |
| 4.5 | 4.5 | 1 |
| 6.2 | 6.2 | 1 |
| 6.3 | 6.3 | 1 |

- No fim de semana, 3.1 + 6.1 funcionam como um setor maior, com 1 médico. O 2.1 + 2.2 também fica com 1 médico. Confirmado pelo dono em 12/11/2026.
- **Postos especiais:**
  - O **4.1** não existe na prática: está fundido ao 4.2 desde a abertura do hospital. Se vier no relatório, as contagens dele somam no 4.2.
  - O **2.3** não abriu. Zerado, fica escondido. Se vier com pacientes, o site avisa e mostra o posto como setor sem médico.
- Um setor pode ter 0 médicos e ser atendido só por apoio. Nesse caso, a sugestão distribui todos os leitos dele entre outros setores.
- Qualquer posto novo no relatório, fora do quadro, segue a mesma regra do 2.3.
- O número de médicos de cada setor é editável no dia, em passos de 0,5, para cobrir férias, doença ou desfalque.
- O total de médicos aparece sempre na tela.

### 6.3 Carga e semáforo

- **Carga do posto** = `Qt hospitalistas`. Cardiologia e geriatria ficam de fora, e as potenciais admissões aparecem como indicador, sem somar à carga.
- **Carga por médico** = carga do setor ÷ médicos do setor.
- **Média do dia** = carga total do hospital ÷ total de médicos.
- **Diferença** = carga por médico do setor − média do dia, em pacientes.

| Diferença | Cor | Significado |
|---|---|---|
| Menor que −2,5 | Azul escuro | Muito abaixo da média |
| De −2,5 a −1,5 | Azul claro | Abaixo da média |
| De −1,5 a +1,5 | Verde | Na média |
| De +1,5 a +2,5 | Amarelo | Acima da média |
| Maior que +2,5 | Vermelho | Sobrecarregado |

- Valores exatamente em ±1,5 ou ±2,5 caem na faixa mais próxima do verde.
- As faixas eram ±1 e ±2 até 19/11/2026. O dono achou a margem curta demais, porque a sugestão pedia apoio por diferenças pequenas, e pediu um pouco mais de tolerância. Os limites ficam em `MARGEM_DO_VERDE` e `MARGEM_DO_AMARELO` (`src/calculo/semaforo.ts`).
- As cores não podem ser a única pista: cada setor também mostra o número e um rótulo.

### 6.4 Sugestão de apoio

- O formato da sugestão é **"Setor A apoia N leitos do Setor B"**, sempre com leitos inteiros.
- Qualquer setor pode apoiar qualquer outro, e não há teto de leitos de apoio.
- **Custo do apoio:** cada leito de apoio pesa **1,25** para o setor que apoia e sai com peso 1 da carga do setor apoiado.
- **Objetivo:** deixar todos os setores no verde, ou o mais perto disso, com o menor número de frases de apoio e, depois, com o menor número de leitos.
- Quando dois resultados empatam, vence a regra de desempate mais simples e estável, como a ordem dos setores. Assim, a mesma entrada dá sempre a mesma sugestão.
- A equipe pode aceitar, mudar ou descartar cada sugestão, e os números se refazem na hora.
- O site mostra a carga antes e depois do apoio.

### 6.5 Saída

- Na tela, o quadro final mostra cada setor com médicos, carga por médico antes e depois do apoio, cor e frases de apoio.
- O botão **Imprimir ou gerar PDF** gera uma folha limpa, com data, tipo de dia (semana ou fim de semana) e o quadro final.

## 7. Requisitos não funcionais

- **Privacidade:** o processamento acontece no navegador. Não há armazenamento nem envio para servidor, e não há análise ou rastreamento que capture conteúdo.
- **Interface:** em português, com os textos separados do código, responsiva e com folha de impressão própria. A estética segue a skill `impeccable`.
- **Arquitetura:** Next.js como site estático (`output: 'export'`) na Vercel, sem backend. TypeScript, Tailwind e Zod para validar o relatório.
- **Qualidade:** a regra de cálculo fica num módulo puro (`calculo/`), com testes Vitest escritos antes do código e relatórios sintéticos.
- **Código aberto:** repositório público no GitHub.
- **Método:** versão enxuta do ContextDevKit, com este PRD, uma spec por capacidade e uma lista de tasks por spec.

## 8. Fora do escopo

- Login, perfis e permissões.
- Histórico de divisões e estatísticas ao longo do tempo.
- Integração direta com o TASY: o relatório é exportado à mão.
- Escala nominal (quem é quem) e divisão de pacientes específicos entre médicos.
- Fugulin ou qualquer escore de complexidade por paciente.
- Restrição de vizinhança entre setores e teto de leitos de apoio.

## 9. Fases de entrega

1. **F1:** importação do relatório, edição dos números, quadro de médicos e semáforo.
2. **F2:** sugestão automática de apoio.
3. **F3:** ajuste manual das sugestões e saída para impressão ou PDF.

## 10. Pendências

1. Escala de cobertura do 3.1 no dia de semana: fica para uma versão futura.

## Anexo A — Formato do relatório 9998 (TASY)

Amostra recebida em 12/11/2026.

- **Arquivo:** extensão `.xls`, mas o conteúdo é **texto separado por tabulação**, sem planilha binária.
- **Codificação:** ISO-8859-1 (Latin-1). Os acentos quebram se o arquivo for lido como UTF-8.
- **Números:** vírgula decimal, às vezes sem o zero à esquerda (`,5`).
- **Cabeçalho:** `Ds posto · Qt hospitalistas · Qt cardio geriatria · Qt potenciais admissoes · Qt pac medico semana · Qt pac medico fim semana · Fator dia semana · Fator fim semana`.
- **Linhas:** uma por posto, mais a linha `Total`. A amostra trouxe 12 postos: 2.1, 2.2, 2.3, 3.1, 4.1 a 4.5 e 6.1 a 6.3. Os postos 2.3 e 4.1 vieram zerados.
- **Nome do posto:** segue o padrão `Unidade de Internação Posto <N> - <A>º PAV`, que vira o código `<A>.<N>`.
- O site deve aceitar também `.csv` e `.xlsx`, caso a TI mude a exportação.

Divergências entre a solicitação à TI e o relatório entregue:

| Item | Solicitado | Entregue |
|---|---|---|
| Fatores do 6.1 / 6.2 / 6.3 (semana) | 1,5 / 2,5 / 2,5 | 2 / 2 / 2 |
| Fatores do 6.x (fim de semana) | 0,5 / 1 / 1 | 1 / 1 / 1 |
| Postos 2.3 e 4.1 | Fora da tabela | Presentes, com fatores 1 e 2,5 |
| Total de médicos | 18 (semana) / 8 (fim de semana) | 21 / 10 |
| Fatores editáveis | Em tabela de parametrização | Fixos no relatório |
| Data e hora de geração | No cabeçalho | Ausentes |

Por isso o site ignora os fatores e as colunas calculadas do relatório.

## 11. Histórico de versões

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 12/11/2026 | Rascunho a partir do áudio do dono |
| 0.2 | 12/11/2026 | Decisões do questionário: pesos, semáforo de cinco cores, regra do apoio, saída em PDF e método |
| 0.5 | 12/11/2026 | Setor como grupo de postos, quadros de semana (9 setores, 18 médicos) e de fim de semana (8 setores, 8 médicos), 4.1 fundido ao 4.2, 2.3 fechado e 3.1 com escala própria na semana |
| 0.4 | 12/11/2026 | Formato real do relatório 9998, quadro de médicos da solicitação à TI e divergências encontradas |
| 0.3 | 12/11/2026 | Admissões e possíveis admissões já estão dentro do total: viram só indicadores, sem peso extra. Removido o termo "carga do GLI" (erro de transcrição) |
