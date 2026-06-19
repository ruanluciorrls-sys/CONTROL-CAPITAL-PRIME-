# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato baseia-se em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

> 🤖 **Para IAs**: antes de mexer no código, leia o [`AGENTS.md`](AGENTS.md) — ele tem a arquitetura, os conceitos do domínio (meta, ciclo, cooperação, prazo), os **bugs conhecidos / dívida técnica** e o **roadmap priorizado** de melhorias futuras.

## [1.8.2] - 2026-06-18

### Alterado
- **Notificações push agora são disparadas no SERVIDOR** (antes era no cliente). As três notificações (meta iniciada, ciclo finalizado, meta finalizada) saem de `server/routers.ts` (mutations `relatorios.create`/`update`). Motivo: no cliente, o PWA do celular guardava versão antiga em cache e a notificação podia não disparar; além disso só funcionaria a partir do aparelho que fez a ação. No servidor (Fly.io) sempre roda a versão nova e entrega para todos os aparelhos do usuário — **confiável e independente do cache**.

## [1.8.1] - 2026-06-18

### Corrigido
- **Notificação de ciclo disparando cedo demais (falso prejuízo)**: antes o aviso saía assim que a linha era adicionada — quando só o depósito estava preenchido e o saque ainda era 0 — gerando "prejuízo" falso (ex.: `Ciclo 4: -R$ 983,00`). Agora um ciclo só notifica quando está **finalizado**: **depósito E saque preenchidos** (baú entra no cálculo se houver, mas é opcional). Dispara **uma única vez**, na transição de incompleto → completo. Exclusão de linha não dispara aviso.

## [1.8.0] - 2026-06-18

### Adicionado
- **Notificações push em tempo real no celular** (o pedido principal do operador): além dos avisos de prazo, o servidor agora dispara push **na hora** em 3 momentos da operação:
  - 🚀 **Meta iniciada** — ao criar um relatório.
  - 💰 / 🔻 **Lucro/Prejuízo por ciclo** — a cada nova linha da planilha (um **ciclo** = `saque − depósito − redepósito + baú`), mostrando o resultado daquele ciclo.
  - 🏁 **Meta finalizada** — ao finalizar, com o **lucro total** (soma dos ciclos + cooperação).
  - Implementado via nova mutation `push.notify` (`server/routers.ts`) chamada do `AppContext.tsx`; cada aviso usa **tag única** para não sobrescrever o anterior no celular.
- **Botão "Instalar app" (PWA)** + sincronização entre dispositivos + logo com brilho reforçado e transições suaves de página.

### Corrigido
- **Diagnóstico de push real**: antes o app dizia "ativado!" mesmo quando a entrega falhava. Agora `push.test` retorna o resultado real da entrega (`total`/`sent`/`failed`/`lastError`) e o sino mostra mensagem honesta: "veja o teste no aparelho", "inscrição não foi salva, abra pelo ícone" ou o erro de entrega. Facilita descobrir por que não chega no celular.
- **`tsconfig.json` sem `target`** (item #1 da auditoria): adicionado `"target": "ES2020"` + exclusão correta de `*.test.tsx`. Agora `npm run check` (tsc) fica **verde**. O build de produção não muda.
- **Abas de "Minhas Operações" cortadas no celular**: os botões encolhiam no flexbox e truncavam o texto ("OPERAÇ...", "CRIAÇÃO ME..."). Adicionado `shrink-0` — agora mantêm a largura e a barra rola de lado.
- **Painel de notificações cortado**: ao abrir para cima a partir do sino no rodapé da sidebar, o topo saía da tela. Agora calcula o espaço disponível, aplica `maxHeight` e usa layout flex (header/rodapé fixos, lista rola dentro) — nunca corta. **No celular** também travava na borda direita: agora a largura é calculada para caber na tela e a posição é presa dentro das bordas (horizontal e vertical).
- **Painel de notificações abrindo para o lado errado** quando o sino está na sidebar esquerda (abre para a direita).
- **Push sem SQL manual**: chaves VAPID via env/constante e tabela criada automaticamente (não precisa mais rodar SQL no Supabase para ativar push).
- **Varredura mobile geral**: corrige zoom indesejado e overflow horizontal.
- **Aviso diário de prazo** disparado às 12h UTC (~9h no horário do Brasil).

### Dívida técnica conhecida (ver `AGENTS.md` › Bugs conhecidos)
- Testes (`MobileButton`, `MobileNav`, `supabase`) falhando por setup do `@testing-library` e env vars ausentes localmente (excluídos do `tsc`, mas o `vitest` ainda quebra).
- Prazo dos relatórios ainda vive só em `localStorage` (coluna não existe no banco) — não sincroniza entre dispositivos.

### ⚠ Importante para o operador (push no celular)
- As notificações de **meta iniciada / ciclo / meta finalizada** são novas e só passam a chegar **após este deploy**.
- No **iPhone**: o push só funciona com o app **instalado na tela inicial** e **aberto pelo ícone** (modo standalone), com a permissão de notificação concedida **dentro do app instalado** (não no Safari). Exige iOS 16.4+.
- Para testar a entrega: abra o sino → "Ativar notificações no celular". Se aparecer erro de entrega, a mensagem agora diz o motivo real.

## [1.7.0] - 2026-06-15

### Adicionado
- **Notificações Push no celular (PWA)**: O site agora pode ser instalado como app no celular e enviar notificações **mesmo com o app fechado** (Web Push). Avisos automáticos de prazos das metas (vence hoje / vencidas) enviados diariamente pelo servidor. Botão "Ativar notificações no celular" no sino + notificação de teste.
- **Enter adiciona linha**: Na tabela do relatório, apertar Enter em qualquer campo da nova linha adiciona (igual ao botão Adicionar), com o foco mantido para entrada rápida.

### Corrigido
- **Sino de notificações sumindo**: O painel agora abre para cima quando o sino está no rodapé (antes abria para baixo e sumia fora da tela).

### Requer (uma vez)
- Rodar o SQL de configuração no Supabase (cria as tabelas de push e grava as chaves de segurança).

## [1.6.0] - 2026-06-09

### Adicionado
- **Sistema de Notificações**: Sino no topo (desktop e mobile) com contador de avisos. Mostra alertas de prazos das casas ativas — **vencidos**, que **vencem hoje** ou nos **próximos 2 dias** — com cores de urgência. Inclui "Marcar como lidas" e estado salvo (não fica avisando o que já foi visto).

### Alterado
- **Mobile**: Menu lateral (hambúrguer) redesenhado no tema navy+gold, com cabeçalho e itens maiores para toque. Inputs com fonte 16px (evita o zoom automático do iPhone). Rolagem suave por toque em tabelas. Tabela de relatório com largura mínima para rolar bem no celular.

### Corrigido
- **Duplicação de casas**: Adicionada proteção contra clique/envio duplo ao salvar casas.
- **Tabela de relatório bugando durante a edição**: Removido o auto-refresh de 7s que atrapalhava a digitação; numeração de linhas mais robusta. A atualização automática continua ao voltar para a aba e após cada ação.
- **Login/Senha da Casa**: Renomeados e com bloqueio de preenchimento automático do navegador.

## [1.5.0] - 2026-06-06

### Adicionado
- **Atualização em tempo real**: O site agora busca dados novos sozinho (a cada ~7s com a aba aberta, ao voltar para a aba e ao reconectar). Edições no calendário global, relatórios finalizados e o selo "Finalizado" aparecem automaticamente, sem clicar em "Atualizar".
- **Seletor de Rede na Criação de Meta**: Ao adicionar uma casa, escolhe-se a Rede (plataforma do calendário) ao lado de "Nome da Casa". O prazo é calculado na hora (data + contagem regressiva) e salvo na casa. Na Operação CPA, ao escolher a Meta, o prazo vem automaticamente — o seletor de Rede foi removido de lá.
- **Selo "Finalizado" na Meta**: Casa com relatório finalizado mostra um selo verde "✓ Finalizado" (a casa permanece na lista, apenas para referência).

### Alterado
- **Dashboard — Gasto/Despesa**: "Proxy (mês)" renomeado para "Gasto / Despesa (mês)" (soma geral). A linha de Gasto + Lucro Real virou dois mini-cards maiores e mais elegantes.
- **Footer da sidebar**: Card de usuário com avatar + botões Atualizar/Logout reorganizados.

### Corrigido
- **Cálculo de prazo**: Agora conta a partir do dia de lançamento real da plataforma (ocorrência mais próxima do dia da semana) + dias de prazo. Ex: VOY lança sábado; mesmo marcando no domingo, conta a partir do sábado. Corrigido também erro de fuso horário (off-by-one).
- **Dropdown de Redes bugado**: A lista aparecia atrás dos cards / com os cards vazando por trás. Reescrita em portal (camada acima de tudo) com fundo 100% sólido.
- Removido o traço final automático nos nomes de Meta.

## [1.4.0] - 2026-06-04

### Adicionado
- **Calendário de Plataformas GLOBAL e compartilhado**: O Gerenciamento de Plataformas (casas + prazos por dia) agora é salvo no banco de dados e **compartilhado entre TODOS os usuários** — atuais e futuros. Quando o admin adiciona, edita ou remove uma plataforma, a mudança aparece automaticamente para todos. Dashboard e Operação CPA leem dessa mesma fonte global.
- **Seed automático**: Na primeira inicialização (banco vazio), as 27 plataformas padrão são inseridas globalmente uma única vez.
- **Controle restrito ao admin**: Apenas o administrador pode adicionar/editar/remover plataformas globais (protegido no servidor via `adminProcedure`). Demais usuários visualizam em modo "Somente leitura".

### Notas sobre compartilhamento (importante)
- **Código / UI / layouts / funcionalidades**: Já são automaticamente globais — todos os usuários carregam o mesmo aplicativo. Qualquer melhoria publicada chega a 100% dos usuários no deploy, sem painel pessoal separado.
- **Dados financeiros (Faturamento, metas, lucros)**: Permanecem **privados por usuário** — cada operador vê apenas os próprios números.

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
