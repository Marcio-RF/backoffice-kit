# Alvos de toque de 44px vêm do tema, não dos primitivos

No celular (menos de 768px), todo alvo de toque precisa de pelo menos 44px. Os primitivos do shadcn (`button`, `dropdown-menu`, `checkbox`…) não são distribuídos pelo kit: os blocos declaram-nos como `registryDependencies` e cada projeto recebe a versão original. Por isso, os 44px vêm de uma regra CSS do `@backoffice/theme` que se aplica abaixo de `md`. Essa regra dá altura visual de 44px aos elementos com texto e aos botões só com ícone, e uma área de toque invisível (pseudo-elemento) às checkboxes, radios e switches. A mesma regra põe os campos de formulário em 16px, para o iOS não fazer zoom.

## Considered Options

- **Fork dos primitivos no registry** (`h-11 md:h-8` em cada um): rejeitado. Separa o kit do shadcn e cada atualização do upstream passaria a ser um merge manual.
- **44px só dentro dos blocos do kit**: rejeitado. O código que cada projeto escreve com os mesmos primitivos ficaria com 32px no celular.

## Consequences

Os ficheiros `src/components/ui/*` continuam com as alturas compactas (`h-8`). Isto é de propósito: não os "corrija". A regra do tema seleciona por `data-slot`, então um primitivo novo do shadcn que mude ou não tenha `data-slot` precisa de ser acrescentado a essa regra.
