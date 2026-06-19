# AGENTS.md — Guia para IAs · Capital Prime Control

> **Leia este arquivo inteiro antes de mexer no código.** Ele existe para que qualquer IA (Claude, GPT, Gemini, etc.) consiga continuar o trabalho sem quebrar nada e sem precisar redescobrir tudo. Mantenha-o atualizado quando fizer mudanças estruturais.

Última atualização: **2026-06-18** · Versão do app: **1.8.0** (ver [`CHANGELOG.md`](CHANGELOG.md)).

---

## 1. Quem é o usuário (importante)

- **Ruan** — operador CPA (afiliado de casas de apostas). **Não é programador.**
- Fala **português do Brasil**. Descreve bugs por foto/print e em linguagem leiga.
- Quer resultado prático e visual, não explicação técnica longa. Vá direto ao ponto.
- **Sempre responda em português.** Todo texto de UI é em português.
- Ele opera no **PC** e quer ser avisado no **celular** em tempo real (daí a importância do push).

## 2. O que é o app

Painel full-stack que um operador CPA usa para controlar a operação:
- **Metas / Casas**: cada "casa" (plataforma de aposta) com login, link da conta-filha, meta, prazo.
- **Relatórios (Operação CPA)**: planilha onde se lançam os **ciclos** de cada meta.
- **Faturamento, Gastos/Despesas, Contas a sacar, Chaves PIX, Slots, Calendário de plataformas**.
- **Painel Admin** (só admin): cria usuários, controla assinatura (active/inactive/trial), reseta senha.
- **PWA com Web Push**: instalável no celular, recebe notificações com o app fechado.

### Conceitos do domínio (decore isto)
- **Casa / Meta**: a plataforma onde se opera. Tem `prazo` (data limite), `meta` (valor alvo), `media`.
- **Relatório**: vinculado a uma casa (`casaId`) + um `agente`. Contém `rows` (os ciclos) e `cooperacao`.
- **Ciclo** = **uma linha** da planilha do relatório. **Resultado do ciclo = `saque − depósito − redepósito + baú`** (no código: `calc = (d,r,s,b) => s - d - r + b`).
- **Lucro total do relatório** = soma dos `resultado` de todos os ciclos **+ `cooperacao`**.
- **Cooperação**: valor extra somado ao resultado final (acordo/bônus).
- **Status de relatório**: `ativo` → `finalizado` → (pode `reutilizar` p/ voltar a `ativo`) · `lixeira`.
- **Status de casa**: `ativa` → `finalizada` · `lixeira`.

## 3. Stack & arquitetura

- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS 4 + Radix UI. Estado de servidor via **tRPC v11 + React Query**.
- **Backend**: Express + **tRPC** (`server/routers.ts`) + **Drizzle ORM** sobre **PostgreSQL (Supabase)**.
- **Auth**: sessão por cookie JWT (`jose`), senha com `bcryptjs`. Procedures: `publicProcedure`, `protectedProcedure`, `adminProcedure`.
- **Push**: `web-push` (VAPID) + Service Worker (`client/public/sw.js`).
- **Deploy**: Docker / **Fly.io** (`fly.toml`) e/ou **Vercel** (`vercel.json`). Build: `vite build` + `esbuild` do servidor.

### Mapa de pastas
```
client/src/
  pages/         → telas (Dashboard, Relatorios, MinhasOperacoes, Faturamento, AdminPanel, etc.)
  components/    → RelatorioSpreadsheet (a planilha), NotificationCenter (o sino), MobileNav, etc.
  contexts/      → AppContext (estado global: casas, relatorios, settings + mutations tRPC)
  lib/           → trpc, push (assinatura push no navegador), types, navigate
  hooks/         → useAuth, usePageTransition, useAutoSave, etc.
server/
  routers.ts     → TODAS as rotas tRPC (a fonte de verdade da API)
  db.ts          → queries Drizzle
  push.ts        → envio de push + agendador de avisos de prazo
  _core/         → infra (trpc, context, sdk, cookies, vite) — NÃO mexer sem necessidade
drizzle/schema.ts → modelo do banco (Postgres)
shared/          → constantes compartilhadas client/server
CHANGELOG.md     → histórico de versões (mantenha!)
todo.md          → histórico de tarefas (legado, quase tudo concluído)
```

### Fluxo de dados (padrão a seguir)
1. UI chama um método do **`AppContext`** (`addRelatorio`, `updateRelatorio`, `finalizarRelatorio`...).
2. O context chama a **mutation tRPC** correspondente e depois faz `query.refetch()`.
3. O servidor (`routers.ts`) valida com **Zod**, chama o **`db.ts`**, retorna.
4. Dados financeiros são **privados por usuário** (`ctx.user.id`). Calendário/plataformas e slots são **globais** (admin controla, todos veem).

## 4. Convenções (siga para manter consistência)

- **Idioma**: tudo em PT-BR (UI, toasts, nomes de variáveis de domínio como `casa`, `relatorio`, `prazo`).
- **Paleta navy + gold**: fundo `#070e20` / `#0f1e45`, dourado `#d4a017` / `#f59e0b`. Verde `#4ade80` (lucro), vermelho `#f87171` (prejuízo). Mantenha esse tema em qualquer tela nova.
- **Toasts** via `sonner` (canto inferior direito) — nunca `alert()`.
- **Mobile-first**: alvos de toque ≥ 44px; inputs com fonte ≥16px (evita zoom do iPhone); cuidado com overflow horizontal e flexbox encolhendo botões (use `shrink-0` em barras de abas roláveis).
- **Listas roláveis de abas**: `flex overflow-x-auto` + `shrink-0` nos itens (senão o texto trunca).
- **Popovers/menus**: renderize em **portal** (`createPortal`) com posição calculada por `getBoundingClientRect`, e **limite a altura ao espaço disponível** para nunca cortar fora da tela (ver `NotificationCenter.tsx`).
- **Push de eventos de operação é SERVER-SIDE** (em `server/routers.ts`, dentro das mutations `relatorios.create` e `relatorios.update`), **não no cliente**. Motivo: o PWA do celular guarda versão antiga em cache, e a lógica no cliente só rodaria a partir do aparelho que fez a ação. No servidor (Fly.io) sempre roda a versão nova e dispara para todos os aparelhos do usuário via `sendPushToUser`. Use **tag única** por evento. Helpers: `fmtBRL`, `nomeDaMeta` em `server/push.ts`.
  - **Meta iniciada** → em `relatorios.create`.
  - **Ciclo (lucro/prejuízo)** → em `relatorios.update`, quando uma linha passa a ter **saque** preenchido (o saque é o que gera o resultado). Dispara ao pôr o saque e **de novo se o resultado mudar** numa edição posterior (ex.: adicionou o baú depois). Não exige depósito. Não dispara em exclusão (renumera linhas).
  - **Meta finalizada** (lucro total) → em `relatorios.update` quando `status` vira `finalizado`.
  - `trpc.push.notify`/`push.test` existem para testes manuais; o fluxo automático não depende deles.

## 5. Como rodar / construir

```bash
npm run dev      # desenvolvimento (tsx watch no servidor + vite)
npm run build    # vite build + esbuild do servidor → dist/
npm run start    # produção (node dist/index.js)
npm run check    # type-check (tsc) — ⚠ atualmente falha, ver Bugs conhecidos
npm test         # vitest — ⚠ alguns testes falham por env/setup
```
Variáveis de ambiente (Fly secrets / `.env`): `DATABASE_URL`/Supabase, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`. Há fallback embutido para as chaves VAPID.

**Deploy (AUTOMÁTICO no `git push origin main`)**: não precisa deploy manual.
- **Frontend (Vercel)**: build automático a cada push.
- **Backend (Fly.io)**: GitHub Actions `.github/workflows/fly-deploy.yml` roda `flyctl deploy` a cada push. Depende do secret de repositório **`FLY_API_TOKEN`** (em GitHub → Settings → Secrets and variables → Actions).
- Se o deploy do Fly começar a falhar com exit code 1 no passo `flyctl deploy` (e o build local passa), o motivo mais provável é o **`FLY_API_TOKEN` expirado/ausente**. Correção: gerar novo token com `fly tokens create deploy -a cpa-report-2026` e atualizar o secret no GitHub.
- O app é **PWA com Service Worker** — após deploy do frontend, o usuário pode precisar **fechar e reabrir** o app no celular para pegar a versão nova (cache).
- O código é o mesmo para todos os usuários — qualquer melhoria chega a 100% deles no deploy.

---

## 6. 🐞 Bugs conhecidos / dívida técnica (auditoria 2026-06-18)

Ordenado por impacto. Itens marcados **[Quick]** são correções rápidas e seguras.

1. ~~**[Quick] `tsconfig.json` sem `target`**~~ ✅ **RESOLVIDO na v1.8.0** — adicionado `"target": "ES2020"` + exclusão de `*.test.tsx`. `npm run check` está verde.
2. **Prazo de relatório só em `localStorage`** (a coluna `prazo` foi removida do schema — ver `drizzle/schema.ts:67` e comentários em `server/routers.ts:196`). **Risco**: trocar de dispositivo ou limpar o cache **perde os prazos dos relatórios**. **Correção definitiva**: rodar `ALTER TABLE relatorios ADD COLUMN IF NOT EXISTS prazo text;`, reativar no schema/rotas e migrar os dados do localStorage.
3. **Testes quebrados**:
   - `MobileButton.test.tsx` / `MobileNav.test.tsx`: `@testing-library/react` não exporta `screen`/`fireEvent` no setup atual (provável incompatibilidade de versão/config do vitest).
   - `supabase.test.ts`: exige env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) — falha fora de produção. Deveria ser `skip` quando não houver env.
4. **Push vai para TODOS os aparelhos do usuário**, inclusive o desktop que disparou a ação (pode duplicar notificação na própria tela). Aceitável hoje. Melhoria: permitir excluir o endpoint de origem ou marcar preferência "só celular".
5. **`localStorage` como fonte de verdade** para vários estados (`relatorio-prazos-v1`, `relatorios-finalizados-em-v1`, `notificacoes-lidas-v1`). Não sincroniza entre dispositivos. Considerar migrar para o banco.
6. **`EditableCell` usa `new Function`** para avaliar expressões matemáticas digitadas (`server`/cliente). Funciona e é uso interno, mas é eval — validar a entrada antes de avaliar.
7. **`@ts-ignore` em `server/push.ts`** (web-push sem tipos). Menor — considerar `@types/web-push`.
8. **Sino: lista interna ainda não mostra "meta iniciada"/"ciclo"** (eventos transitórios vão só pro push). Se quiser histórico no sino, persistir esses eventos.

## 7. 🗺 Roadmap de melhorias futuras (priorizado)

> O operador pediu que outra IA possa pegar este roadmap e implementar. Cada item é independente.

### Prioridade ALTA (saúde do projeto)
- [x] ~~Corrigir `tsconfig` (target ES2020)~~ ✅ feito na v1.8.0.
- [ ] **Persistir prazo de relatório no banco** (resolver item 2 dos bugs) — elimina perda de dados ao trocar de dispositivo.
- [ ] **Estabilizar a suíte de testes** (corrigir imports do testing-library; `skip` dos testes que dependem de env).

### Prioridade MÉDIA (valor pro operador)
- [ ] **Exportação em PDF de relatórios** (já estava no `todo.md` como desejado).
- [ ] **Mais métricas/análise e comparação entre períodos** no Faturamento/Dashboard.
- [x] ~~Ordenação e paginação~~ ✅ v1.9.0 (Contas). _Falta aplicar em Relatórios Finalizados se necessário._
- [x] ~~Preferência "somente celular"~~ ✅ v1.9.0 (toggle no sino + filtro por device no servidor).
- [x] ~~Resumo diário no push~~ ✅ v1.9.0 (push_daily + envio ~20h Brasil).

### Prioridade BAIXA (refino)
- [x] ~~Histórico dos eventos de push no sino~~ ✅ v1.9.0 (ciclos via `push_log`).
- [x] ~~Bulk actions (finalizar vários relatórios)~~ ✅ v1.9.0.
- [~] Tema claro revisado — v1.9.0 melhorou o contraste; redesign completo do modo claro segue pendente (app é dark-first).

## 8. Regras para a IA que for editar

1. **Responda em PT-BR**, direto, com o que mudou e por quê. Sem aula de código.
2. **Não quebre o tema navy+gold** nem o idioma português da UI.
3. **Dados financeiros são privados por usuário** — sempre filtre por `ctx.user.id` no servidor. Plataformas/slots são globais e protegidos por `adminProcedure`.
4. **Toda rota nova entra no `server/routers.ts`** com validação Zod; toda query no `db.ts`.
5. **Toda mudança de estado passa pelo `AppContext`** (não chame mutations soltas na UI sem necessidade).
6. **Atualize o `CHANGELOG.md`** (nova versão semântica) e, se mexer em arquitetura/conceito, **atualize este `AGENTS.md`**.
7. **Teste mentalmente o mobile** (375px) e o desktop. Cuidado com overflow e flexbox.
8. **Commit/push e deploy** só quando o usuário pedir. Mensagens de commit em PT-BR, no padrão `tipo: descrição` (ex.: `fix:`, `feat:`, `chore:`).
9. Em caso de dúvida sobre regra de negócio (o que é ciclo, como calcula lucro, prazo), **este arquivo é a referência**.
