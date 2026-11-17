# backoffice-kit

Padrão visual de back office partilhado entre projetos: um protótipo de referência e um registry de onde cada projeto instala o tema e os blocos.

## Distribuição

**Bloco**:
Uma unidade instalável do registry (`@backoffice/<nome>`). Depois de instalada, passa a pertencer ao projeto.
_Avoid_: componente (para a unidade instalável), pacote, módulo

**Primitivo**:
Um componente base do shadcn/ui (botão, sheet, checkbox…) de que os blocos dependem, mas que o kit não distribui nem altera.
_Avoid_: componente ui, átomo

**Rótulos**:
O conjunto de textos visíveis de um bloco, com valores padrão em inglês, que cada projeto pode substituir para o seu idioma.
_Avoid_: strings, traduções, i18n

## Tamanhos de ecrã

**Celular**:
Qualquer viewport com menos de 768px de largura. É o único critério que define o comportamento móvel do kit, seja qual for o tipo de ponteiro.
_Avoid_: mobile, móvel, ecrã pequeno, touch

**Alvo de toque**:
A área que reage ao toque num elemento interativo. No celular mede pelo menos 44px.
_Avoid_: hit area, área clicável

**Densidade**:
A altura das linhas da tabela (confortável ou compacta). Só existe a partir de 768px.
_Avoid_: espaçamento, tamanho

## Listagens

**Lista de cartões**:
A forma da tabela de dados no celular: cada registo aparece como um cartão, e não como uma linha.
_Avoid_: modo mobile, card view

**Slot do cartão**:
O lugar que uma coluna ocupa no cartão: título, subtítulo, estado ou valor. As colunas sem slot não aparecem no cartão.
_Avoid_: colunas principais, campos móveis

**Filtros**:
O conjunto de filtros por faceta e a ordenação de uma listagem. No celular ficam num painel de baixo; a pesquisa fica sempre visível, fora dos Filtros.
_Avoid_: chips, facetas (para o conjunto)

**Detalhe**:
O painel que mostra um registo e as suas ações. Abre de lado a partir de 768px e em tela cheia no celular.
_Avoid_: drawer, modal, sheet (para o conceito)

## Fluxos

**Fluxo móvel**:
Um layout de tela cheia, sem sidebar, para tarefas operadas no celular (PDV, cadastro com câmera): barra superior com voltar e título do passo, conteúdo e barra de ação principal fixa embaixo.
_Avoid_: wizard, stepper, tela mobile
