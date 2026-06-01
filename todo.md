# Project TODO - CPA Report 2026

## Dark Mode
- [x] Melhorar contraste em Relatórios Finalizados (deixar mais escuro ao selecionar)

## Gráficos de Tendências
- [x] Instalar dependência Recharts
- [x] Criar componente TrendChart para visualizar evolução de lucro
- [x] Integrar gráfico nos relatórios periódicos (Semanal, Mensal, Anual)
- [x] Testar gráficos com dados reais
- [x] Validar responsividade dos gráficos

## Bug Fixes
- [x] Corrigido erro de key prop faltando na linha de totais do RelatorioSpreadsheet
- [x] Corrigir persistência de dados - salvar todas as alterações automaticamente no banco
- [x] Corrigir erro de conversão de data ao atualizar casa (formato ISO)
- [x] Corrigir erro NaN em children de elemento React (primeira ocorrência)
- [x] Simplificar campos de data em Gerenciar Casas (apenas 1 campo - Prazo)
- [x] Corrigir erro NaN em children (segunda ocorrência - AbaProgresso)

## Gerenciamento de Datas e Prazos
- [x] Adicionar campos de data e prazo em Gerenciar Casas
- [x] Integrar dados de data/prazo em Relatórios Ativos
- [x] Testar persistência de datas

## Funcionalidades Futuras
- [ ] Filtros avançados em relatórios finalizados
- [ ] Exportação em PDF de relatórios

## Importação de Prazo
- [x] Importar prazo de Gerenciar Casas para Relatórios Ativos
- [x] Importar prazo de Gerenciar Casas para Relatórios Finalizados
- [x] Testar importação de prazo

#### Correções Solicitadas
- [x] Corrigir numeração independente por relatório (não compartilhada entre relatórios)
- [x] Mostrar prazo no popup de criação de novo relatório
- [x] Garantir que prazo apaça em Relatórios Finalizados

## Nova Aba de Contas
- [x] Criar modelo de dados para Contas (usuário, senha, valor, status)
- [x] Criar componente de Contas com tabela e formulário
- [x] Integrar aba de Contas no Dashboard
- [x] Adicionar funções de editar e excluir
- [x] Testar aba de Contas

## Correção de Prazo no Popup
- [x] Preencher automaticamente prazo no popup com valor de Gerenciar Casas

## Lixeira de Relatórios
- [x] Criar status "lixeira" para relatórios deletados
- [x] Criar aba de Lixeira em Relatórios Ativos
- [x] Implementar função de restaurar relatórios
- [x] Testar lixeira e restauração

## Correções Urgentes
- [x] Corrigir exclusão de relatórios em Relatórios Criados
- [x] Exibir datas de prazos corretamente em Relatórios Criados
- [x] Adicionar ícone de lixeira visível para deletar relatórios


## Melhorias Completas - Fase 1: Interface & UX
- [x] Adicionar breadcrumb de navegação
- [x] Melhorar responsividade em mobile
- [x] Adicionar loading skeletons em tabelas
- [x] Melhorar feedback visual de ações (toasts)
- [x] Adicionar animações suaves em transições
- [x] Melhorar acessibilidade (ARIA labels, keyboard navigation)

## Melhorias Completas - Fase 2: Performance
- [x] Implementar lazy loading de componentes
- [x] Otimizar re-renders com React.memo
- [x] Implementar virtualização de tabelas grandes
- [x] Otimizar queries do banco de dados
- [x] Adicionar cache inteligente

## Melhorias Completas - Fase 3: Validações Robustas
- [x] Validar inputs de valores monetários
- [x] Validar datas (não permitir datas futuras em prazos)
- [x] Validar campos obrigatórios antes de salvar
- [x] Adicionar confirmação em ações críticas (deletar)
- [x] Melhorar mensagens de erro

## Melhorias Completas - Fase 4: Relatórios & Cálculos
- [ ] Adicionar mais métricas de análise
- [ ] Melhorar precisão dos cálculos
- [ ] Adicionar exportação em PDF
- [ ] Adicionar comparação entre períodos
- [ ] Adicionar previsões/projeções

## Melhorias Completas - Fase 5: Gerenciamento de Dados
- [x] Adicionar busca global
- [x] Adicionar filtros avançados em todas as tabelas
- [ ] Adicionar ordenação por colunas
- [ ] Adicionar paginação em tabelas grandes
- [ ] Adicionar bulk actions (deletar múltiplos)

## Correcoes de Bugs
- [x] Corrigir exclusao de relatorios (import useApp faltando)
- [x] Adicionar feedback visual ao deletar/restaurar relatorios
- [x] Melhorar acessibilidade do botao de delete

## Melhorias em Contas
- [x] Tornar campo senha opcional em Contas
- [x] Tornar campo valor opcional em Contas
- [x] Atualizar validacoes no servidor
- [x] Permitir multiplos formularios de Contas abertos simultaneamente
- [x] Adicionar botao para abrir novo formulario
- [x] Permitir fechar formularios individuais

## Exibicao de Prazo em Relatorios
- [x] Importar prazo da casa para relatorios criados
- [x] Exibir prazo no card de relatorio criado
- [x] Formatar prazo de forma legivel

## Entrada Manual de Prazo
- [x] Permitir digitar prazo manualmente em Gerenciar Casas
- [x] Adicionar placeholder com exemplo de formato (DD/MM/YYYY)
- [x] Sincronizar prazo manual com planilha de relatorios
- [x] Exibir prazo na secao amarela de relatorios

## Numeracao de Relatorios
- [x] Fazer cada relatorio comecar do numero 1
- [x] Numeracao deve ser independente entre relatorios
- [x] Ao criar nova linha, numero deve continuar dentro do relatorio

## Duplicar Relatorios
- [x] Criar funcao de duplicacao de relatorios
- [x] Adicionar botao de duplicar na interface
- [x] Duplicar todas as linhas do relatorio
- [x] Resetar numeracao para comecar do 1

## Persistencia de Imagem de Fundo
- [x] Salvar imagem de fundo no banco de dados
- [x] Carregar imagem de fundo ao iniciar aplicacao
- [x] Remover imagem apenas quando usuario clicar em remover

## Correcao de Prazo em Nova Casa
- [ ] Corrigir prazo nao sendo salvo ao criar nova casa
- [ ] Incluir prazo na funcao addCasa
- [ ] Testar se prazo é salvo corretamente

## Migracao para Supabase Storage
- [x] Instalar cliente Supabase
- [x] Configurar variaveis de ambiente Supabase
- [x] Criar buckets no Supabase (casas, relatorios, contas, configs)
- [x] Atualizar servidor para usar Supabase
- [x] Atualizar cliente para usar Supabase
- [x] Testar migracao de dados

## Correcao de Dashboard
- [x] Corrigir bug de NA no dashboard
- [x] Garantir calculo automatico de casas finalizadas
- [x] Validar dados antes de calcular
- [x] Testar com relatorios ativos

## Botoes de Copiar em Contas
- [x] Criar componente CopyButton
- [x] Adicionar botoes de copiar usuario e senha
- [x] Adicionar feedback visual ao copiar
- [x] Testar funcionalidade

## Atalhos de Teclado em Contas
- [x] Implementar Ctrl+U para copiar usuario
- [x] Implementar Ctrl+S para copiar senha
- [x] Adicionar indicadores visuais dos atalhos
- [x] Testar atalhos em diferentes navegadores

## Correcao de Total de Lucro
- [x] Corrigir calculo de Total de Lucro mostrando NaN
- [x] Excluir relatorios em lixeira dos calculos
- [x] Adicionar botao para esvaziar lixeira
- [x] Testar com diferentes periodos

## Otimizacao Mobile Completa
- [x] Criar componente MobileNav com menu hamburger
- [x] Adaptar App.tsx para layout responsivo
- [x] Otimizar Dashboard para mobile
- [x] Otimizar Relatorios para mobile
- [x] Otimizar Contas para mobile
- [x] Otimizar GerenciarCasas para mobile
- [x] Melhorar tamanho de botoes e inputs (44x44px minimo)
- [x] Adaptar tabelas para mobile (cards ou scroll)
- [x] Testar em viewport mobile (375px, 768px)
- [x] Criar testes de responsividade

## Correcoes e Melhorias - Mobile e Contas
- [x] Corrigir z-index do menu mobile para ocultar dashboard
- [x] Implementar seleção múltipla de contas com checkboxes
- [x] Adicionar botão "Selecionar Todos" em Contas
- [x] Implementar ações em lote (excluir, mudar status)
- [x] Criar lixeira para contas deletadas
- [x] Adicionar botão para restaurar contas da lixeira
- [x] Testar seleção múltipla
- [x] Testar lixeira de contas

## Correcoes Criticas - Mobile e Performance
- [x] Corrigir z-index do menu mobile (dashboard ainda aparece na frente)
- [x] Remover delay ao clicar em contas (otimizar mutations)
- [x] Corrigir logica de delecao - contas devem ir para lixeira, nao deletar
- [x] Testar menu mobile em viewport 375px
- [x] Testar delecao em lote e ir para lixeira

## Bugs e Melhorias de UI - Contas
- [x] Corrigir bug de lixeira - contas nao estao indo para lixeira ao deletar
- [x] Melhorar contraste do titulo "Contas" com fundo
- [x] Ajustar cores do modo noturno (areas muito escuras)
- [x] Testar deletar conta individual
- [x] Testar deletar multiplas contas
- [x] Testar lixeira com novo status

## Edicao de Nome Colorido - Dashboard
- [x] Criar componente ColorfulNameEditor
- [x] Implementar nome grande e centralizado
- [x] Adicionar cores aleatorias por letra
- [x] Permitir edicao do nome em tempo real
- [x] Adicionar figurinhas tematicas de acordo com fundo
- [x] Testar componente no Dashboard

## Persistencia - Nome Colorido
- [x] Criar API para salvar nome colorido
- [x] Implementar auto-save no ColorfulNameEditor
- [x] Carregar dados salvos ao inicializar
- [x] Testar persistencia de nome
- [x] Testar persistencia de cores
- [x] Testar persistencia de emojis

## Separacao de Componentes - Nome Colorido
- [x] Criar ColorfulNameDisplay para Dashboard (apenas visualizacao)
- [x] Criar ColorfulNameEditor para Editar Dados (com botoes de edicao)
- [x] Integrar ColorfulNameDisplay no Dashboard
- [x] Integrar ColorfulNameEditor em Editar Dados
- [x] Testar visualizacao no Dashboard
- [x] Testar edicao em Editar Dados
- [x] Testar persistencia entre paginas

## Edicao Inline em Relatorios Finalizados
- [x] Analisar estrutura de RelatoriosFinalizados
- [x] Implementar edicao inline com modal/form
- [x] Adicionar botao de editar (lapis)
- [x] Manter botao de reutilizar
- [x] Implementar salvamento inline
- [x] Testar edicao sem sair da pagina
- [x] Testar reutilizar mantendo funcionalidade
- [x] Testar estrutura normal apos salvar

## Correcao de Delay de Video
- [x] Encontrar onde esta o video e seu carregamento
- [x] Corrigir delay de carregamento do nome do video
- [x] Implementar sincronizacao automatica
- [x] Testar carregamento rapido
- [x] Testar sincronizacao apos edicao

## Edicao Inline Automatica em Relatorios Ativos
- [x] Analisar estrutura de Relatorios Ativos
- [x] Criar componente de campo editavel inline
- [x] Implementar edicao automatica ao clicar
- [x] Integrar em Relatorios Ativos (Deposito e Saque)
- [x] Testar edicao inline sem botao de lapis
- [x] Testar salvamento automatico

## Calculo Automatico - Expressoes Matematicas
- [x] Criar componente EditableCell com suporte a expressões
- [x] Implementar parser de expressões (+ - * /)
- [x] Calcular automaticamente ao Enter
- [x] Integrar em Depósito, Saque e Baú
- [x] Testar expressões simples (72 + 72)
- [x] Testar expressões complexas (100 * 2 - 50)
- [x] Validar entrada de usuário

## Historico, Desfazer e Validacoes
- [x] Implementar histórico de cálculos em EditableCell
- [x] Adicionar CTRL+Z para desfazer mudanças
- [x] Implementar validações com avisos (valores negativos)
- [x] Mostrar histórico de cálculos ao usuário
- [x] Testar desfazer com múltiplas mudanças
- [x] Testar validações em diferentes cenários

## Correcao de Prazo em Nova Casa
- [x] Corrigir prazo não sendo salvo ao criar nova casa
- [x] Incluir prazo na função addCasa
- [x] Testar se prazo é salvo corretamente

- [x] Exibir prazo na listagem de casas

## Melhoria de CTRL+Z - Mostrar Expressao e Desfazer por Campo
- [x] Modificar EditableCell para mostrar expressão (ex: 72 + 72)
- [x] Implementar histórico isolado por campo (não global)
- [x] Fazer CTRL+Z desfazer apenas o campo selecionado
- [x] Testar expressões com múltiplos campos
- [x] Testar desfazer em cada campo independentemente

## Navegacao por Tab entre Campos
- [x] Implementar sistema de navegação Tab
- [x] Integrar em RelatorioSpreadsheet
- [x] Testar Tab entre Depósito, Saque, Baú
- [x] Testar Shift+Tab para voltar

## Corrigir Sistema de Expressoes Matematicas
- [x] Atualizar schema do banco para armazenar expressoes
- [x] Modificar EditableCell para salvar expressao e resultado
- [x] Atualizar RelatorioSpreadsheet para usar novo sistema
- [x] Implementar CTRL+Z global para desfazer ultima edicao
- [x] Implementar CTRL+Y global para refazer edicao
- [x] Testar e validar funcionamento


## Restaurar Layout de Cooperacao e Totalizações
- [x] Buscar versão anterior do RelatorioSpreadsheet
- [x] Restaurar layout colorido e grande de Cooperação
- [x] Restaurar layout colorido e grande de Totalizações
- [x] Restaurar layout colorido e grande de Resultado
- [x] Testar e validar layout


## Isolar Histórico de CTRL+Z por Relatório
- [x] Analisar problema de histórico compartilhado entre relatórios
- [x] Implementar histórico isolado por relatório (não global)
- [x] Testar isolamento entre Outono da WE e Voina
- [x] Verificar que CTRL+Z só afeta relatório atual


## PRIORIDADE: Isolar Completamente Cada Relatório
- [x] Identificar causa do compartilhamento de dados entre relatórios
- [x] Isolar estado de cada relatório completamente
- [x] Testar isolamento total entre relatórios
- [x] Verificar que Cooperação, Depósito, Saque, Baú não se misturam

## Implementar Salvamento Automático a Cada 30 Segundos (DEPOIS)
- [ ] Analisar sistema atual de salvamento automático
- [ ] Implementar salvamento periódico a cada 30 segundos
- [ ] Adicionar indicador visual de salvamento
- [ ] Testar salvamento automático em todos os campos


## Permitir Apagar Zero dos Campos
- [x] Identificar por que o zero nao pode ser apagado
- [x] Corrigir logica de input para permitir campo vazio
- [x] Testar exclusao de zeros em Deposito, Saque, Bau
- [x] Verificar que funciona em todos os relatorios


## Implementar Lixeira para Casas em Gerenciar Casas
- [x] Adicionar campo status ao schema de casas
- [x] Implementar lixeira em GerenciarCasas com abas
- [x] Adicionar funcoes de restaurar e esvaziar lixeira
- [x] Testar lixeira de casas


## BUG: Corrigir erro NaN no Dashboard
- [x] Identificar onde NaN está sendo renderizado como children
- [x] Corrigir valores NaN em componentes de cards
- [x] Testar e validar correção


## BUG: Deletar Casa nao funciona em Gerenciar Casas
- [x] Investigar por que deletar casa nao move para lixeira
- [x] Corrigir funcao deleteCasa
- [x] Testar deletar casa


## BUG CRÍTICO: Relatorios compartilham dados entre si
- [x] Investigar por que relatorios estao puxando dados um do outro
- [x] Isolar completamente cada relatorio (sem compartilhamento)
- [x] Garantir que cada relatorio tenha historico proprio
- [x] Testar isolamento total entre relatorios
- [x] Adicionar deep copy em todas as operacoes de relatorios


## Reestruturar Tabela de Relatorios (CORRIGIDO)
- [x] Restaurar painel lateral ao layout anterior colorido
- [x] Remover botao adicionar da tabela
- [x] Manter clique duplo e botoes editar/deletar
- [x] Adicionar coluna ReDeposito entre Deposito e Saque
- [x] Testar isolamento de relatorios


## BUG: Corrigir erro de keys faltantes em tbody
- [x] Adicionar keys unicos em todos os elementos da tabela
- [x] Adicionar clique duplo para editar valores
- [x] Testar se o erro foi corrigido

## Remodelação do Dashboard - Fase 1
- [ ] Remover filtro de mês do Dashboard
- [ ] Remover gráfico de Análise de Lucros
- [ ] Remover card de Lucro Total com Desconto de Proxy
- [ ] Manter apenas LUCRO EM CAIXA no topo

## Remodelação do Dashboard - Fase 2: Seção de Resumo
- [ ] Criar seção de quadradinhos em grid (2-3 colunas)
- [ ] Adicionar card "Casas Ativas" (clicável → Gerenciar Casas)
- [ ] Adicionar card "Casas Finalizadas" (clicável → Casas Finalizadas)
- [ ] Adicionar card "Relatórios Criados" (clicável → Relatórios Ativos)
- [ ] Adicionar card "Contas para Sacar" (clicável → Contas)
- [ ] Adicionar card "Gasto com Proxy" (clicável → Gasto com Proxy)
- [ ] Adicionar seção de Calendário com casas por dia da semana
- [ ] Aplicar cores diferentes para cada quadradinho
- [ ] Testar navegação clicável de cada card

## Remodelação do Dashboard - Fase 3: Calendário
- [ ] Integrar calendário de Gerenciar Casas no Dashboard
- [ ] Mostrar casas por dia da semana
- [ ] Exibir prazos das casas no calendário
- [ ] Tornar calendário visualmente bonito e fácil de entender
- [ ] Testar exibição de casas por dia

## Remodelação do Dashboard - Fase 4: Testes e Finalização
- [ ] Testar layout responsivo em mobile
- [ ] Testar cliques em todos os cards
- [ ] Testar exibição de calendário
- [ ] Validar visual geral

## Correção de Dashboard - Puxar Dados Reais
- [x] Analisar estrutura do Calendário para entender como casas são armazenadas por dia
- [x] Implementar "Lançamentos de Hoje" puxando casas do Calendário com seus prazos
- [x] Corrigir "Contas para Sacar" para puxar contagem real da página de Contas
- [x] Testar sincronização automática quando novas casas são adicionadas
- [x] Validar exibição de prazos junto com as casas

## Mudança de Layout - Lançamentos de Hoje
- [x] Converter grid de cards para listagem vertical
- [x] Fazer itens menores e compactos
- [x] Adicionar cores diferentes para cada plataforma
- [x] Manter organização e legibilidade

## Correção de Navegação - Resumo Rápido
- [x] Corrigir "Casas Ativas" para navegar para "Relatórios Ativos" em vez de "Gerenciar Casas"
- [x] Testar navegação de todos os cards do Resumo Rápido

## BUG - Cliques nos Cards do Dashboard não funcionam
- [x] Investigar por que os cliques nos cards do Resumo Rápido não estão navegando
- [x] Verificar se o onClick está sendo chamado
- [x] Corrigir a navegação dos cards
- [x] RESOLVIDO: Mudado de button com onClick para Link do Wouter - agora redirecionando perfeitamente!

## Transições Suaves - Fade-out/Fade-in
- [x] Criar hook customizado para transições de página
- [x] Implementar fade-out ao sair da página
- [x] Implementar fade-in ao entrar na página
- [x] Testar em todas as navegações - Funcionando perfeitamente!

## Remodelação do Dashboard - Fase 2: Seção de Calendário
- [x] Analisar estrutura do Calendário para puxar dados
- [x] Criar componente de Calendário para o Dashboard
- [x] Integrar seção de Calendário no Dashboard
- [x] Testar exibição de casas por dia da semana com cores diferentes
- [x] Validar navegação clicável de cada card

## Otimização - Adicionar Múltiplas Casas Simultaneamente
- [ ] Modificar formulário de "Adicionar Nova Casa" para permitir múltiplos formulários
- [ ] Adicionar botão "Adicionar Outro" para abrir novo formulário
- [ ] Permitir salvar múltiplas casas de uma vez
- [ ] Testar adição de 2, 3, 4+ casas simultaneamente

## Correção - Transição de Relatórios (Reutilizar/Finalizar)
- [ ] Corrigir lógica de "Reutilizar" para remover de Finalizados e adicionar em Ativos
- [ ] Corrigir lógica de "Finalizar" para remover de Ativos e adicionar em Finalizados
- [ ] Garantir que não haja duplicação de relatórios entre abas
- [ ] Testar ciclo completo: Ativo → Finalizado → Reutilizar → Ativo → Finalizado


## MUDANÇAS IMPLEMENTADAS - 25/02/2026

### ✅ Otimização - Adicionar Múltiplas Casas Simultaneamente
- [x] Implementar formulário para adicionar múltiplas casas
- [x] Adicionar botão "Adicionar Outro" para adicionar mais formulários
- [x] Testar funcionalidade de múltiplos formulários - Funcionando perfeitamente!
- [x] Validar salvamento de várias casas de uma vez

### ✅ Correção - Transição de Relatórios
- [x] Corrigir lógica de "Reutilizar" para mover em vez de copiar
- [x] Remover relatório de "Relatórios Finalizados" ao clicar em "Reutilizar"
- [x] Garantir que relatório aparece apenas em "Relatórios Ativos"
- [x] Testar fluxo completo: Finalizar → Reutilizar → Finalizar novamente - Funcionando perfeitamente!


## Refatoração de Layout - Gerenciar Casas
- [ ] Reduzir tamanho dos formulários de casas
- [ ] Converter para quadradinhos pequenos em grid
- [ ] Implementar modal pop-up para adicionar casas
- [ ] Deixar layout mais compacto e organizado
- [ ] Testar novo layout em modo claro e escuro


## ✅ REFATORAÇÃO COMPLETA - GERENCIAR CASAS
- [x] Layout refatorado para quadradinhos pequenos em grid (4 colunas)
- [x] Modal pop-up implementado para adicionar casas
- [x] Múltiplos formulários funcionando perfeitamente
- [x] Cores diferentes para cada casa (azul, verde, roxo, rosa, amarelo, ciano)
- [x] Testado em modo claro e escuro - ambos funcionando
- [x] Botão "+ Adicionar Outro" para adicionar mais casas
- [x] Botão "Salvar X Casas" dinâmico
- [x] Layout muito mais compacto e organizado


## Adicionar Campo "Média" ao Modal de Gerenciar Casas
- [x] Adicionar campo "Média" ao formulário do modal
- [x] Organizar campos: Nome, Login, Senha, Meta, Média, Data
- [x] Testar salvamento do campo Média
- [x] Validar exibição nos quadradinhos de casas - Funcionando perfeitamente!


## Adicionar Botão de Finalizar em Gerenciar Casas
- [x] Adicionar botão "Finalizar" em cada casa (quadradinho)
- [x] Implementar lógica para mover casa de "Casas Ativas" para "Casas Finalizadas"
- [x] Registrar data de finalização
- [x] Testar funcionalidade de finalizar
- [x] Validar que casa desaparece de "Casas Ativas" após finalizar - Funcionando perfeitamente!


## Melhorar Exibição de Casas em Gerenciar Casas
- [x] Remover cifrão da Meta - exibir apenas número
- [x] Adicionar botão de copiar para Login
- [x] Adicionar botão de copiar para Senha
- [x] Adicionar botão de copiar para Link/ID da conta
- [x] Melhorar visualização desses campos (deixar bem aparecido)
- [x] Testar funcionalidade de cópia em todos os campos - Funcionando perfeitamente!
- [x] Validar que prazo continua aparecendo - Funcionando perfeitamente!


## Aumentar Tamanho dos Cards de Casas
- [x] Aumentar altura dos quadradinhos para acomodar Link ID
- [x] Garantir que Link ID não ultrapasse o card
- [x] Manter layout responsivo em diferentes tamanhos de tela
- [x] Testar em desktop, tablet e mobile
- [x] Validar que todos os campos cabem bem dentro do card - Funcionando perfeitamente!
