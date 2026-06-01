# Observações sobre Relatórios

## Problema Identificado

Ao clicar em "Reutilizar" em um relatório finalizado, o relatório **aparece duplicado** em "Relatórios Ativos":

- **VOY DIA 21/02** aparece **2 vezes** em "Relatórios Ativos"
- Uma é a cópia original criada antes
- Uma é a nova cópia criada ao clicar em "Reutilizar"

## Causa

A função `reutilizarRelatorio` está **criando uma nova cópia** em vez de **mover** o relatório de "Relatórios Finalizados" para "Relatórios Ativos".

## Solução Implementada

Alterado o AppContext para que `reutilizarRelatorio` **mude o status** de "finalizado" para "ativo" em vez de criar uma nova cópia.

## Próximas Verificações

- Verificar se o relatório foi removido de "Relatórios Finalizados"
- Verificar se não há mais duplicação em "Relatórios Ativos"
- Testar o fluxo completo: Finalizar → Reutilizar → Finalizar novamente
