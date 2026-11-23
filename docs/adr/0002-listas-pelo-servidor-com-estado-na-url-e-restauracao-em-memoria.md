# Listas pelo servidor, com estado na URL e restauração em memória

Origem: ADR-0009 do Donna ERP. Nada aberto a partir de uma listagem a desmonta, e toda paginação é por scroll infinito.

A `DataTable` passa a ter duas fontes. A principal é paginada por cursor no servidor: `fetchPage({ cursor, query })` devolve `{ items, nextCursor, total, facets? }`, e a pesquisa, os filtros e a ordenação são executados no servidor. A outra é o `data` local, para listas pequenas. A pesquisa, os filtros e a ordenação vivem na URL (`q`, um parâmetro por coluna, `sort`), que é a única fonte desse estado. As páginas carregadas e a posição do scroll ficam num cache em memória do módulo: no máximo 5 listas, cada uma por até 10 minutos e com até 1.000 itens. A posição é guardada como índice do primeiro item visível mais o deslocamento, e não em pixels. O F5 perde o cache e mantém só a URL.

Tudo o que se abre a partir de uma lista é um Dialog roteado num único slot `@modal` no layout do app, com um interceptador `(.)<rota>` por rota de registo. Por isso, ir de um registo a outro (Cliente → venda) troca só o conteúdo, sem sair da moldura.

## Considered Options

- **TanStack Query para cache e paginação:** rejeitado. Exige um provider no app, e o nosso cache precisa de regras próprias (LRU de poucas listas, scroll por índice, marcas nos itens alterados), que acabariam a ser escritas por cima dele de qualquer forma.
- **sessionStorage para o cache:** rejeitado. O ADR do ERP quer que o F5 mantenha só os filtros, e serializar milhares de itens a cada scroll custa mais do que vale.
- **Scroll em pixels:** rejeitado. Com linhas virtualizadas e larguras diferentes entre celular e desktop, a mesma posição em pixels aponta para itens diferentes.
- **Um slot `@modal` por listagem:** rejeitado. Só intercepta as rotas da própria listagem, então abrir um registo de outro tipo a partir do Detalhe sairia da moldura.

## Consequences

- Toda listagem precisa de um endpoint com cursor, e de um `fetchItem(id, query) → { item, matches } | null` para atualizar só o item alterado. O `matches` vem do servidor, que conhece a regra dos filtros.
- O estado de filtros que não cabe na URL não é suportado.
- Voltar pela sidebar mostra os dados como estavam, sem nova busca: alterações feitas por outros só aparecem depois de 10 minutos, numa nova pesquisa ou no F5.
- Cada rota de registo existe duas vezes no app (o interceptador e a página inteira), e as duas renderizam o mesmo conteúdo.
