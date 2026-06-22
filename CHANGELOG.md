# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato baseia-se em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

> 🤖 **Para IAs**: antes de mexer no código, leia o [`AGENTS.md`](AGENTS.md) — ele tem a arquitetura, os conceitos do domínio (meta, ciclo, cooperação, prazo), os **bugs conhecidos / dívida técnica** e o **roadmap priorizado** de melhorias futuras.

## [1.12.2] - 2026-06-19

### Adicionado
- **Ao reutilizar um relatório, pergunta se reativa a meta vinculada**: caixa de confirmação igual à de finalizar — "Sim (reativa relatório e meta)" ou "Não (só o relatório)". Se "Sim" e a meta estiver finalizada, ela volta de Casas Finalizadas para Operação CPA.

## [1.12.1] - 2026-06-19

### Adicionado
- **Ao finalizar um relatório, pergunta se finaliza a meta vinculada**: ao clicar em "Finalizar Relatório", abre uma caixa perguntando se quer finalizar **também a casa/meta** ligada — "Sim (finaliza os dois)" ou "Não (só o relatório)". Assim você decide caso a caso se a meta acabou junto.

## [1.12.0] - 2026-06-19

### Adicionado
- **Notificações agendadas (horário de Brasília)**:
  - **8h, 12h, 17h** → resumo dos lançamentos do dia (ciclos · metas finalizadas · lucro).
  - **23:59** → relatório do dia com **lucro real** (metas finalizadas + cooperação).
  - **Domingo 23:59** → resultado da semana. **Último dia do mês 23:59** → resultado do mês.
  - Mantido o resumo de ciclos das ~20h. Tudo enviado só para quem tem push ativo.
- **`finalizadoEm` no banco**: registra quando cada relatório foi finalizado (antes só no aparelho). Base para os resumos por período e para os filtros mensais funcionarem em qualquer aparelho. Migração automática do localStorage.
- **Filtro por mês em Relatórios Finalizados**: seletor de mês (não mistura mais os meses). Casas Finalizadas já tinha; Faturamento tem filtros de data + comparativo mensal.

### Notas
- O lucro dos resumos é o **lucro real** (com cooperação), por data de finalização — coerente com o "Lucro em Caixa".

## [1.11.4] - 2026-06-19

### Adicionado / Alterado (Chaves PIX)
- **Importar vários arquivos de uma vez, com o nome do arquivo como banco**: ao importar `.txt`, dá pra selecionar **vários** arquivos; as chaves de cada um já entram com o **banco = nome do arquivo** (ex.: `Nubank.txt` → banco "Nubank").
- **Detecção de tipo corrigida**: antes CPF e celular (ambos 11 dígitos) se confundiam. Agora distingue **CPF × telefone** (celular = DDD válido + '9'), trata fixo (10 díg.), +55 (12-13 díg.), além de email e chave aleatória (EVP).
- **Chaves salvas localmente**: a lista de chaves não some mais ao recarregar (persiste no aparelho).

## [1.11.3] - 2026-06-19

### Adicionado
- **Botão "Desfazer" na planilha do relatório**: recupera a última ação na tabela de depósito/saque — inclusive **linha excluída sem querer** (na lixeirinha de ação), edições de valor, etc. Guarda até 30 ações e dá pra retroceder várias vezes. Fica embaixo da tabela.

## [1.11.2] - 2026-06-19

### Adicionado
- **Auto-update (todos os usuários pegam as atualizações sozinhos)**: o app agora detecta quando uma nova versão foi publicada (comparando o hash do bundle do index.html publicado com o carregado) e **recarrega automaticamente** — sem o usuário precisar limpar cache. Não interrompe quem está editando (respeita a trava de edição) e avisa com um toast antes de recarregar. Resolve o "as atualizações não chegam para todos" (era cache do navegador/PWA de cada aparelho).

## [1.11.1] - 2026-06-19

### Corrigido
- **Desconexão automática "do nada" / login em vários aparelhos**: o `useAuth` deslogava e mandava pro login sempre que a query `auth.me` falhava — inclusive em **falhas temporárias** (servidor reiniciando durante um deploy, cold start do Fly, oscilação de rede). Agora **só desloga quando o servidor confirma que não há sessão** (resposta ok com usuário nulo); falhas temporárias **tentam de novo** (retry com backoff) e mantêm a sessão. Resultado: dá pra ficar logado em **vários aparelhos ao mesmo tempo** sem um derrubar o outro. Também blindado o servidor: a atualização de "último acesso" virou **não-fatal** (não derruba a sessão se a escrita falhar).

### Alterado
- **Dashboard**: o ícone $ foi movido para a **esquerda** (ao lado de "Lucro em Caixa") e o relógio ficou sozinho à direita.

## [1.11.0] - 2026-06-19

### Adicionado
- **Comparativo mensal no Faturamento**: card na Visão Geral com lucro do mês atual vs mês anterior, variação % e leitura de tendência (subindo/caindo).
- **Editar receita manual**: além de adicionar/excluir, agora dá pra **editar** uma receita (botão de lápis na lista; mutation `receitas.update`).

### Corrigido / Alterado
- **Prazo do relatório salvo no banco** (resolve risco de perda de dados): a coluna `prazo` voltou ao schema (criada via `ALTER` automático), o servidor persiste no create/update e há uma **migração única** que envia ao banco os prazos que só existiam no `localStorage`. Não se perde mais ao trocar de aparelho/limpar cache.
- **Transições de aba mais suaves**: unificadas as regras conflitantes de animação (fade + leve slide/scale com easing suave), troca mais ágil.
- **Polimento dos cards do Dashboard**: sombra colorida no hover, glow sutil, ícone com leve zoom e seta deslizando.

### Pendente (projeto à parte)
- **Modo claro completo**: o app é dark-first com centenas de estilos fixos; um modo claro 100% consistente é um trabalho dedicado (não incluído neste lote para não arriscar o tema escuro que funciona).

## [1.10.0] - 2026-06-19

### Adicionado
- **Receita manual (bônus) no Faturamento**: botão "+ Receita" (valor + descrição + data) para lançar ganhos avulsos (ex.: bônus de conta). Salvo no banco (sincroniza PC/celular) e soma no lucro total. Nova tabela `receitas` (auto-criada).

### Alterado
- **Histórico do Faturamento reformulado (por casa)**: agora mostra cada **casa finalizada** com depósito, saque, baú, cooperação e o **LUCRO REAL** (ciclos + cooperação). O total do período passou a ser o **lucro real** (casas + cooperação + receitas).
- **Removido o "prejuízo" enganoso**: o histórico antes somava só os ciclos (sem a cooperação), mostrando um "Resultado do período" negativo que não refletia a realidade da operação CPA. Removidos os cards de "Prejuízo"/"Resultado período" e os cards mensais de lucro vs prejuízo.

## [1.9.3] - 2026-06-19

### Corrigido
- **Modal "Editar Casa"**: depois de salvar a edição, o modal **não fechava** e virava o "Adicionar Casas" vazio (com "Salvar 0 Casas"). Agora fecha corretamente ao salvar.
- **Visual do formulário de edição de casa**: estava com campos "pelados" (sem rótulos). Agora tem os mesmos **rótulos e visual do formulário de criação** (Nome, Login, Senha, Meta, Média, Prazo, Link da Casa, Link da Conta-Filha).

## [1.9.2] - 2026-06-19

### Corrigido
- **Valores de ciclo "sumindo" ao salvar** (bug introduzido na 1.9.1): a atualização otimista mudava só a tela, mas não o cache interno do tRPC. Quando outra ação recarregava algo (criar/finalizar casa ou meta), o app reconstruía a lista a partir do cache antigo e os ciclos salvos sumiam. Agora cada atualização otimista também **sincroniza o cache** (`utils.<entidade>.list.setData`), e a criação de relatório anexa ao cache em vez de recarregar a lista toda. Sem mais sumiço.

## [1.9.1] - 2026-06-19

### Alterado (responsividade — resposta instantânea)
- **Comandos do painel agora respondem na hora** (atualização otimista). Antes, cada ação esperava o servidor responder **e recarregava a lista inteira** antes de atualizar a tela — por isso "Finalizar" e "salvar valores do ciclo" demoravam. Agora a tela muda **imediatamente** e a sincronização com o servidor acontece em segundo plano (sem `refetch` bloqueante da lista toda). Em caso de erro, reconcilia com o servidor automaticamente.
- Aplicado em: salvar valores de ciclo / cooperação, finalizar / reutilizar / deletar relatório, e finalizar / editar / deletar / restaurar casa.

## [1.9.0] - 2026-06-19

### Adicionado (lote de melhorias do roadmap)
- **Resumo diário no push**: à noite (~20h Brasil) chega um aviso "Hoje você lucrou R$ X em N ciclos" (acumula o resultado dos ciclos do dia no servidor, tabela `push_daily`; ajusta o total quando um ciclo é editado).
- **Opção "só no celular"**: toggle no rodapé do sino para não receber os avisos no PC (cada inscrição guarda se é `mobile`/`desktop`; o servidor não envia para desktops quando a opção está ligada).
- **Histórico de avisos no sino**: o servidor registra cada ciclo em `push_log` (com data) e o sino mostra os ciclos recentes junto das metas finalizadas e prazos.
- **Selecionar e finalizar vários relatórios de uma vez**: botão "Selecionar vários" na aba Relatórios, com checkbox nos cards, "Marcar todos" e "Finalizar selecionados".
- **Ordenação e paginação em Contas**: seletor de ordenação (mais recentes / maior valor / casa / usuário) e paginação de 12 por página.

### Alterado
- **Tema claro**: melhor contraste do texto secundário/muted (só afeta o modo claro). O app continua dark-first por design.

### Infra
- Ponto de restauração `v1.8.4-estavel` criado antes deste lote.
- Tabelas `push_daily`, `push_prefs` e `push_log` criadas automaticamente (sem migration manual).

## [1.8.4] - 2026-06-19

### Alterado
- **Ícone do app (tela inicial) com a coroa maior**: a coroa dourada foi ampliada (~1,42x) e centralizada, ocupando melhor o ícone. O fundo navy foi mantido porque o iPhone **não permite ícone de app transparente** (transparência vira fundo preto). Para ver o ícone novo no celular, é preciso remover e re-adicionar o app à tela inicial (cache do iOS).

## [1.8.3] - 2026-06-18

### Alterado
- **Regra do aviso de ciclo simplificada para o que o operador quer**: o gatilho agora é o **saque** (é o que gera o resultado). Quando o saque é preenchido → notifica lucro/prejuízo na hora. Se depois o operador **editar** (ex.: esqueceu o baú, ou mudou o saque) e o **resultado mudar**, **notifica de novo** com o valor atualizado. O depósito não é mais exigido para disparar (o que importa é o resultado). Exclusão de linha continua não disparando.

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
