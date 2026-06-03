# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato baseia-se em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.3.0] - 2026-06-03

### Adicionado
- **Padronização visual completa (navy + gold)**: Todas as páginas e botões foram unificados na paleta do painel (`#070e20` / `#0f1e45` / `#d4a017`). Abas em estilo "pill" dourado, cards com fundo translúcido e bordas suaves.
- **Notificações Toast**: Todas as ações (restaurar, excluir, editar, finalizar, recuperar, exportar, esvaziar lixeira) agora exibem uma notificação elegante no **canto inferior direito**, em vez de `alert()` do navegador. Estilo navy+gold, com botão de fechar.
- **Dashboard — métricas clicáveis**: Cada card de métrica navega diretamente para a aba correspondente. "Casas Ativas" renomeado para "Operação CPA".
- **Dashboard / Faturamento — Gastos + Lucro Real**: Linha discreta exibindo gasto de proxy do período e lucro real (lucro − despesas).
- **Operação CPA — seletor de Meta e Redes**: Formulário de novo relatório com dropdown de Metas (casas) e dropdown elegante de Redes agrupado por dia da semana (carregado do Gerenciamento de Plataformas), preenchendo o prazo automaticamente com contagem regressiva.
- **Gerenciamento de Plataformas**: Página em Configurações com colunas por dia da semana, cores por dia, lixeira, edição e persistência. Sincroniza com o Dashboard em tempo real.
- **Gastos / Despesas** (antigo "Gasto com Proxy"): Redesenhada com categorias (Proxy, SMS, Postagem Instagram, Bot, VPS, Outros), cards de Custo do Dia / Mês e histórico colorido.
- **Chaves PIX — seleção múltipla**: Selecionar várias chaves para copiar ou apagar em lote.

### Alterado
- **Logo premium**: Coroa redesenhada com anel dourado, glow pulsante e brilho interno (sidebar, header mobile e modal de Apresentação).
- **Cards de relatório**: Maiores, com lucro centralizado e destaque, prazo com data + contagem regressiva.
- **Relatório (planilha)**: Redesign completo navy+gold — cards de Agente/Prazo, Meta, Link da Conta-Filha (agora exibindo o link real), tabela e painel lateral elegantes.
- **Footer da sidebar**: Card de usuário com avatar, botões Atualizar e Logout reorganizados de forma elegante.
- **Título da aba do navegador**: "Capital Prime Control".
- Removidos: botão de Tema, header "Dashboard CPA", traço final automático que aparecia em nomes de Meta (ex: "VOY 01 -").

### Corrigido
- **Erro 500 ao criar relatório**: A coluna `prazo` não existia no banco; removida do schema Drizzle e persistida via localStorage.
- **Erro 500 ao adicionar gasto**: Data enviada como objeto `Date` em vez de string `yyyy-MM-dd`.
- **Criar relatório**: Não exige mais o campo Agente, apenas a Meta.
- Campos numéricos da tabela e cooperação não mostram mais "0" — ficam vazios prontos para preenchimento.

## [1.2.0] - 2026-06-02

### Adicionado
- **Faturamento — Evolução & Histórico**: As abas Evolução e Histórico agora são funcionais com persistência via localStorage. É possível registrar o faturamento de cada mês (lucro, depósitos, saques, operações) e visualizar gráfico de área na Evolução e tabela completa no Histórico com totalização.
- **Faturamento — Apresentação**: O botão "Apresentação" exibe um modal premium com logo do sistema, lucro de hoje, 7 dias, mês atual e total acumulado com barra de progresso da meta.
- **Faturamento — Performance**: Cards de performance em tempo real com tendência positiva/negativa, lucro real do mês e alertas automáticos.
- **Relatorios — Seletor de Plataformas do Calendário**: No formulário de criação de relatório, é agora possível selecionar diretamente uma plataforma do calendário (VOY, WE, 888, etc.). Ao selecionar, o sistema: vincula automaticamente a casa ativa correspondente, calcula e exibe o prazo com contagem regressiva ao vivo, e pré-formata o nome como `VOY-[sufixo]` para identificação.
- **Calendário dentro de Configurações**: A aba Calendário foi movida para dentro de Configurações, limpando o menu lateral.
- **Link da Conta Filha no cadastro de casas**: O campo "Link da Conta Filha" agora aparece no início do formulário de adição de casas, eliminando a necessidade de editar após o cadastro.

### Alterado
- **Botão de Atualização**: Movido do canto inferior direito (floating) para o topo: na sidebar desktop (footer) e no header mobile. Removido de dentro das páginas.
- **Minhas Operações — ordem das sub-abas**: Reordenado para Operação CPA → Gerenciar Casas → Casas Finalizadas → Relatórios Finalizados.
- **Faturamento — Visual**: Cores alinhadas ao painel premium (navy + gold #d4a017). Removidos filtros "Todos Operadores" e "Todas Redes".
- **Casas Finalizadas — Filtro de Mês**: Design mais elegante com pills dourados, exibe somente meses que possuem casas.
- **Chaves PIX — Cores**: Paleta reestilizada para seguir o tema do painel (navy + gold) em vez de preto puro.
- **Configurações**: Removidas as seções de Logo, Nome do Aplicativo, Cor Primária e Armazenamento de Dados. Removida a aba de Importar/Exportar. Adicionada a aba de Calendário de Plataformas.
- **Gerenciar Casas — Formulário**: Campo "Meta" removido do cadastro. Modal com visual glassmorphism premium. Link da Conta Filha movido para o topo do formulário.

### Corrigido
- Header mobile recebe props `onRefresh`/`isRefreshing` corretamente.
- Sidebar desktop sem o ícone de Calendário (movido para Configurações).

---

## [1.1.0] - 2026-06-02

### Adicionado
- **Faturamento**: Nova aba adicionada ao menu lateral, incluindo um painel financeiro interativo para visão geral, evolução e histórico da receita. Adicionado também gráficos de rentabilidade, inteligência de operação ao vivo e definição de metas com layout Premium Dark.
- **Chaves PIX**: Novo gerenciador de importação de chaves em lote com detecção automática do tipo de chave (CPF, Telefone, Email, EVP). O painel suporta cópia rápida em massa, exportação para TXT e filtros com busca integrada.
- **Botão de Atualização Global**: Adicionado botão flutuante no canto inferior direito que recarrega suavemente a interface do sistema sem a necessidade de atualizar a aba do navegador completamente.

### Alterado
- **Minhas Operações**: O menu lateral e as funcionalidades foram reorganizados. O antigo menu "Gerenciar Casas" foi renomeado para "Minhas Operações" e agora agrupa internamente (via sub-abas) as páginas: *Operação CPA*, *Relatórios Finalizados*, *Casas Finalizadas* e *Gerenciar Casas* (formulário de edição). Essa mudança deixou o menu principal mais limpo e organizado.

## [1.0.0] - Versão Inicial
- Lançamento inicial da plataforma Capital Prime Control (RUAN DARK CPA).
- Sistema de controle de casas, relatórios, contas e configurações de tema.

---

> **Deploy**: Sempre que uma nova versão for lançada, lembre-se de fazer o push para o repositório e acionar o deploy na plataforma configurada (Vercel/Fly.io).
