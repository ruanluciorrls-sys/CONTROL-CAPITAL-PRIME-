import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, Edit2, Check, X, ExternalLink, Copy, TrendingUp, TrendingDown, Undo2 } from "lucide-react";
import { setEditingActive } from "@/lib/syncLock";
import AvisoRede from "@/components/AvisoRede";
import { montanteDaOperacao } from "@shared/recarga";
import type { SalvamentoRelatorio } from "@/lib/salvamentoRelatorios";
import { progressoRecarga } from "@/lib/visaoRelatorios";
import "./RelatorioSpreadsheet.css";

interface RelatorioRow {
  numero: number;
  deposito: number;
  redeposito: number;
  saque: number;
  bau: number;
  resultado: number;
  depositoExpr?: string;
  redepositoExpr?: string;
  saqueExpr?: string;
  bauExpr?: string;
}

interface RelatorioSpreadsheetProps {
  casaNome: string;
  agente: string;
  prazo: string;
  login?: string;
  cooperacao: number;
  onCooperacaoChange: (valor: number) => void;
  linkContaFilha?: string;
  media?: number;
  meta?: number;
  metaRecarga?: number | null;
  /** Jogos da última vez nesta rede — lembrete fixo enquanto faz o relatório */
  jogosUltimaVez?: string;
  /** Rede da casa (VOY, EK...) — para o aviso compartilhado */
  rede?: string;
  rows: RelatorioRow[];
  onAddRow: (row: RelatorioRow) => void;
  onDeleteRow: (numero: number) => void;
  onUpdateRow: (numero: number, row: RelatorioRow) => void;
  onRestoreRows?: (rows: RelatorioRow[]) => void;
  salvamento?: SalvamentoRelatorio;
  ocultarValores?: boolean;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const valorOculto = "••••";
const camposValores = ["deposito", "redeposito", "saque", "bau"] as const;

const inputStyle = "w-full px-2 py-1.5 rounded-lg text-right text-sm text-white font-mono bg-transparent border border-white/20 focus:outline-none focus:border-[#d4a017] focus:bg-white/5";

export default function RelatorioSpreadsheet({
  casaNome, agente, prazo, login, cooperacao, onCooperacaoChange,
  linkContaFilha, media = 0, meta = 0, metaRecarga, jogosUltimaVez = "", rede = "", rows, onAddRow, onDeleteRow, onUpdateRow, onRestoreRows,
  salvamento, ocultarValores = false,
}: RelatorioSpreadsheetProps) {
  const [newRow, setNewRow] = useState<RelatorioRow>({ numero: rows.length + 1, deposito: 0, redeposito: 0, saque: 0, bau: 0, resultado: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<RelatorioRow | null>(null);
  const [cooperacaoRascunho, setCooperacaoRascunho] = useState<string | null>(null);
  const cooperacaoInput = cooperacaoRascunho ?? (isNaN(cooperacao) ? "0" : cooperacao.toString());
  const valorCooperacao = parseFloat(cooperacaoInput);
  const cooperacaoPendente = cooperacaoRascunho !== null && !isNaN(valorCooperacao) && valorCooperacao !== cooperacao;
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [loginCopiado, setLoginCopiado] = useState(false);

  const copyLogin = () => {
    if (!login) return;
    navigator.clipboard.writeText(login);
    setLoginCopiado(true);
    setTimeout(() => setLoginCopiado(false), 2000);
  };

  const confirmarCooperacaoRef = useRef(onCooperacaoChange);
  useEffect(() => { confirmarCooperacaoRef.current = onCooperacaoChange; }, [onCooperacaoChange]);
  const debounceCooperacaoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmarCooperacao = useCallback((valor: number) => {
    if (debounceCooperacaoRef.current !== null) clearTimeout(debounceCooperacaoRef.current);
    setCooperacaoRascunho(null);
    confirmarCooperacaoRef.current(valor);
  }, []);

  useEffect(() => {
    if (ocultarValores || !cooperacaoPendente) return;
    const timer = setTimeout(() => confirmarCooperacao(valorCooperacao), 800);
    debounceCooperacaoRef.current = timer;
    return () => {
      clearTimeout(timer);
      debounceCooperacaoRef.current = null;
    };
  }, [ocultarValores, cooperacaoPendente, valorCooperacao, confirmarCooperacao]);
  const proximoNumero = () => (rows.length ? Math.max(...rows.map((r) => r.numero || 0)) : 0) + 1;
  useEffect(() => { setNewRow({ numero: proximoNumero(), deposito: 0, redeposito: 0, saque: 0, bau: 0, resultado: 0 }); }, [rows.length]);

  // ── Histórico para DESFAZER (recupera linha excluída sem querer, edições, etc.) ──
  const historicoRef = useRef<RelatorioRow[][]>([]);
  const rowsAnteriorRef = useRef<RelatorioRow[]>(rows);
  const restaurandoRef = useRef(false);
  const [podeDesfazer, setPodeDesfazer] = useState(false);

  useEffect(() => {
    if (restaurandoRef.current) {
      // mudança veio de um "desfazer" — não registra no histórico
      restaurandoRef.current = false;
      rowsAnteriorRef.current = rows;
      return;
    }
    const anterior = rowsAnteriorRef.current;
    if (JSON.stringify(anterior) !== JSON.stringify(rows)) {
      historicoRef.current.push(anterior);
      if (historicoRef.current.length > 30) historicoRef.current.shift();
      rowsAnteriorRef.current = rows;
      setPodeDesfazer(true);
    }
  }, [rows]);

  const desfazer = () => {
    const hist = historicoRef.current;
    if (ocultarValores || hist.length === 0 || !onRestoreRows) return;
    const anterior = hist.pop()!;
    restaurandoRef.current = true;
    rowsAnteriorRef.current = anterior;
    onRestoreRows(anterior);
    setPodeDesfazer(hist.length > 0);
  };

  const calc = (d: number, r: number, s: number, b: number) => s - d - r + b;

  const handleAddRow = () => {
    if (ocultarValores) return;
    const resultado = calc(newRow.deposito, newRow.redeposito, newRow.saque, newRow.bau);
    onAddRow({ ...newRow, numero: proximoNumero(), resultado });
    setNewRow({ numero: proximoNumero() + 1, deposito: 0, redeposito: 0, saque: 0, bau: 0, resultado: 0 });
  };

  const handleEditSave = () => {
    if (ocultarValores || !editRow || editingId === null) return;
    const d = isNaN(editRow.deposito) ? 0 : editRow.deposito;
    const r = isNaN(editRow.redeposito) ? 0 : editRow.redeposito;
    const s = isNaN(editRow.saque) ? 0 : editRow.saque;
    const b = isNaN(editRow.bau) ? 0 : editRow.bau;
    onUpdateRow(editingId, { ...editRow, deposito: d, redeposito: r, saque: s, bau: b, resultado: calc(d, r, s, b) });
    setEditingId(null); setEditRow(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, _field: string, rowNumero: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEditSave();
      const idx = rows.findIndex((r) => r.numero === rowNumero);
      if (idx < rows.length - 1) setTimeout(() => { setEditingId(rows[idx + 1].numero); setEditRow({ ...rows[idx + 1] }); }, 50);
    }
  };

  const totals = {
    deposito: rows.reduce((s, r) => s + (r.deposito || 0) + (r.redeposito || 0), 0),
    redeposito: rows.reduce((s, r) => s + (r.redeposito || 0), 0),
    saque: rows.reduce((s, r) => s + (r.saque || 0), 0),
    bau: rows.reduce((s, r) => s + (r.bau || 0), 0),
    resultado: rows.reduce((s, r) => s + (r.resultado || 0), 0),
  };

  const recarga = metaRecarga != null;
  const progressoDaRecarga = metaRecarga != null && !ocultarValores ? progressoRecarga(rows, metaRecarga) : null;
  const rotuloRecebimento = recarga ? "Salário recebido" : "Cooperação";
  const montante = montanteDaOperacao(meta, media, metaRecarga);
  const progressoPct = montante > 0 ? Math.min((totals.deposito / montante) * 100, 100) : 0;
  const resultadoFinal = totals.resultado + cooperacao;
  const exibirValor = (valor: number) => ocultarValores ? valorOculto : fmt(valor);
  const resultadoPositivo = totals.resultado >= 0;
  const resultadoFinalPositivo = resultadoFinal >= 0;
  const linhaEmEdicao = editRow && rows.find(row => row.numero === editingId);
  const linhaPendente = camposValores.some(campo =>
    newRow[campo] !== 0 || (linhaEmEdicao && editRow && linhaEmEdicao[campo] !== editRow[campo]),
  );
  const edicaoLocal = cooperacaoPendente || linhaPendente;
  const rotuloEdicaoLocal = ocultarValores ? "Edição local pausada" :
    cooperacaoPendente ? "Aguardando envio..." : "Alterações locais não enviadas";
  const prazoFmt = prazo ? new Date(prazo + "T00:00:00").toLocaleDateString("pt-BR") : null;

  // Remove traço/espaços finais do nome (ex: "VOY 01 -" -> "VOY 01")
  const casaNomeLimpo = casaNome.replace(/[\s-]+$/, "").trim();

  const copyLink = () => {
    if (!linkContaFilha) return;
    navigator.clipboard.writeText(linkContaFilha);
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2000);
  };

  const thStyle = "px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 text-right";
  const tdStyle = "px-4 py-3 text-right font-mono text-sm text-white/70";
  const tdBorder = "border-b border-white/5";

  return (
    <div className="operacoes-planilha planilha-fonte-ampliada space-y-5"
      onFocusCapture={() => setEditingActive(true)}
      onBlurCapture={() => setEditingActive(false)}
    >

      <div role="status" aria-live="polite" className={!edicaoLocal && !salvamento ? "sr-only" : undefined}>
        {(edicaoLocal || salvamento) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 rounded-xl border border-[#d4a017]/20 w-fit text-xs font-bold"
            style={{ background: "rgba(212,160,23,0.06)" }}
          >
            {edicaoLocal && <span className="text-[#d4a017]">{rotuloEdicaoLocal}</span>}
            {salvamento?.status === "salvando" && <span className="text-[#d4a017]">Salvando no servidor...</span>}
            {salvamento?.status === "erro" && <span className="text-red-400">Não foi possível confirmar o salvamento.</span>}
            {salvamento?.status === "salvo" && !edicaoLocal && (
              <span className="text-emerald-400">
                Salvo às{" "}
                <time dateTime={salvamento.salvoEm}>{new Date(salvamento.salvoEm).toLocaleTimeString("pt-BR")}</time>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Lembrete: jogos da última vez nesta rede/casa */}
      {jogosUltimaVez && jogosUltimaVez.trim() && (
        <div className="rounded-2xl p-3 border border-[#d4a017]/20 flex items-start gap-2.5" style={{ background: "rgba(212,160,23,0.06)" }}>
          <span className="text-base leading-none mt-0.5">🕑</span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#d4a017]/70 mb-1">🎰 Jogos da última vez nesta {casaNomeLimpo}</p>
            <div className="flex flex-wrap gap-1.5">
              {jogosUltimaVez.split(",").map((j) => j.trim()).filter(Boolean).map((j, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-bold text-[#f3d078]"
                  style={{ background: "rgba(212,160,23,0.14)", border: "1px solid rgba(212,160,23,0.3)" }}
                >{j}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Aviso compartilhado da rede (todos os operadores veem/editam) */}
      {rede && <AvisoRede rede={rede} />}

      {/* Header — Info do Relatório */}
      <div className="planilha-cabecalho grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Agente + Prazo */}
        <div className="planilha-cartao rounded-2xl p-5 border relative overflow-hidden"
          style={{ background: "var(--card-bg-gradient)", borderColor: "var(--card-border-highlight)" }}
        >
          <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl" style={{ background: "#d4a017" }} />
          <p className="text-[9px] font-black uppercase tracking-widest text-white/60 dark:text-white/45 mb-3">Agente & Prazo</p>
          <p className="planilha-titulo-agente font-black text-lg text-white/90 dark:text-white truncate">{agente || "—"}</p>
          {/* Login da conta */}
          {login && (
            <div className="planilha-login flex items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Login:</span>
              <span className="min-w-0 text-[11px] font-mono text-[#d4a017]/90 truncate">{login}</span>
              <button
                onClick={copyLogin}
                title={loginCopiado ? "Copiado!" : "Copiar login"}
                className="planilha-acao-icone flex items-center justify-center w-5 h-5 rounded-md transition-all shrink-0"
                style={{
                  background: loginCopiado ? "rgba(212,160,23,0.25)" : "rgba(212,160,23,0.1)",
                  border: "1px solid rgba(212,160,23,0.25)",
                  color: loginCopiado ? "#d4a017" : "rgba(212,160,23,0.6)",
                }}
              >
                {loginCopiado ? <Check size={9} /> : <Copy size={9} />}
              </button>
            </div>
          )}
          {prazoFmt && (
            <p className="text-sm font-bold mt-2" style={{ color: "#d4a017" }}>{prazoFmt}</p>
          )}
        </div>

        {/* Casa Nome */}
        <div className="planilha-cartao relative overflow-hidden rounded-2xl p-5 border border-emerald-500/20 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/35"
          style={{ background: "linear-gradient(145deg, rgba(7, 26, 18, 0.75), rgba(12, 42, 30, 0.5))" }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
          <div className="relative">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/70 dark:text-emerald-400/50 mb-1 text-center">{recarga ? "Meta - Recarga" : "Meta"}</p>
            <p className="planilha-titulo-casa font-black text-2xl text-emerald-300 dark:text-emerald-200 text-center">{casaNomeLimpo}</p>
          </div>
        </div>

        {/* Link da Conta-Filha */}
        {linkContaFilha ? (
          <div className="planilha-cartao rounded-2xl p-5 border border-[#a78bfa]/20 flex flex-col"
            style={{ background: "linear-gradient(145deg, rgba(13, 7, 32, 0.75), rgba(21, 11, 46, 0.5))" }}
          >
            <p className="text-[9px] font-black uppercase tracking-widest text-[#a78bfa]/70 dark:text-[#a78bfa]/50 mb-2">Link da Conta-Filha</p>

            {/* Link real exibido */}
            <a href={linkContaFilha} target="_blank" rel="noopener noreferrer"
              className="planilha-link block text-[11px] font-mono text-[#c4b5fd]/80 hover:text-[#c4b5fd] transition-colors truncate mb-3 underline decoration-[#a78bfa]/30 underline-offset-2"
              title={linkContaFilha}
            >
              {linkContaFilha.replace(/^https?:\/\//, "")}
            </a>

            <div className="flex justify-center gap-2 mt-auto">
              <a href={linkContaFilha} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa" }}
              >
                <ExternalLink size={11} /> Acessar
              </a>
              <button onClick={copyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}
              >
                {linkCopiado ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar</>}
              </button>
            </div>
          </div>
        ) : <div />}
      </div>

      {/* Cards de Métricas */}
      <div className="planilha-metricas grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Qtd DEP */}
        {!recarga && <div className="planilha-cartao rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: "var(--card-bg-gradient)", borderColor: "var(--card-border-highlight)", borderLeft: "3px solid #60a5fa" }}
        >
          <p className="text-[9px] font-black uppercase tracking-widest text-white/60 dark:text-white/45 mb-2">Quantidade de DEP</p>
          <p className="planilha-metrica text-3xl font-black" style={{ color: "#60a5fa" }}>{ocultarValores ? valorOculto : meta}</p>
          <p className="text-[10px] text-white/50 dark:text-white/40 mt-1">DEPs necessários</p>
        </div>}

        {/* Montante */}
        <div className={`planilha-cartao rounded-2xl p-5 border border-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/35 ${recarga ? "md:col-span-2" : ""}`}
          style={{ background: "linear-gradient(145deg, rgba(7, 26, 18, 0.75), rgba(12, 42, 30, 0.5))", borderLeft: "3px solid #4ade80" }}
        >
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/70 dark:text-emerald-400/50 mb-2">Montante a Atingir</p>
          <p className={`planilha-metrica ${recarga ? "text-4xl" : "text-3xl"} font-black text-emerald-300 dark:text-emerald-200`}>
            {exibirValor(isNaN(montante) ? 0 : montante)}
          </p>
          {progressoDaRecarga && (
            <p className="mt-1 text-xs text-emerald-100">
              {fmt(progressoDaRecarga.realizado)} lançados · faltam {fmt(progressoDaRecarga.falta)}
            </p>
          )}
          {prazoFmt && <p className="text-[10px] text-emerald-400/55 dark:text-emerald-400/40 mt-1">Prazo: {prazoFmt}</p>}
          {!ocultarValores && montante > 0 && (
            <div className="mt-3">
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(74,222,128,0.1)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressoPct}%`, background: "linear-gradient(90deg, #34d399, #4ade80)", boxShadow: "0 0 10px rgba(74,222,128,0.6)" }} />
              </div>
              <p className="text-[9px] text-emerald-400/55 dark:text-emerald-400/40 mt-1">{progressoPct.toFixed(1)}% do montante</p>
            </div>
          )}
        </div>

        {/* Progresso Cooperação */}
        <div className="planilha-cartao rounded-2xl p-5 border border-[#a78bfa]/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#a78bfa]/35"
          style={{ background: "linear-gradient(145deg, rgba(13, 7, 32, 0.75), rgba(21, 11, 46, 0.5))", borderLeft: "3px solid #a78bfa" }}
        >
          <p className="text-[9px] font-black uppercase tracking-widest text-[#a78bfa]/70 dark:text-[#a78bfa]/50 mb-2">{rotuloRecebimento}</p>
          {!ocultarValores && <div className="flex gap-2 items-center mb-2">
            <input
              type="number"
              aria-label={rotuloRecebimento}
              inputMode="decimal"
              value={cooperacaoInput === "0" ? "" : cooperacaoInput}
              onChange={(e) => setCooperacaoRascunho(e.target.value || "0")}
              className="min-w-0 flex-1 px-3 py-1.5 rounded-xl text-sm text-white font-mono bg-transparent border border-white/15 focus:outline-none focus:border-[#a78bfa]"
              placeholder=""
            />
            <button onClick={() => { if (cooperacaoPendente) confirmarCooperacao(valorCooperacao); }}
              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-black text-[#050b18]"
              style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}
            >OK</button>
          </div>}
          <p className="planilha-metrica text-2xl font-black text-[#a78bfa]">{exibirValor(cooperacao)}</p>
        </div>
      </div>

      {/* Layout: Tabela + Painel */}
      <div className="planilha-layout">

        {/* Tabela */}
        <div className="min-w-0 rounded-2xl border overflow-hidden"
          style={{ background: "var(--card-bg-gradient)", borderColor: "var(--card-border-highlight)" }}
        >
          <div className="overflow-x-auto">
          <table className="planilha-tabela w-full" aria-label="Lançamentos do relatório">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(212,160,23,0.2)", background: "rgba(212,160,23,0.05)" }}>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/60 dark:text-white/45 text-left">#</th>
                {["Depósito", "ReDepósito", "Saque", "Baú", "Resultado"].map((h) => (
                  <th key={h} className={thStyle}>{h === "ReDepósito" ? <>Re<wbr />Depósito</> : h}</th>
                ))}
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/60 dark:text-white/45 text-center">Ação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) =>
                !ocultarValores && editingId === row.numero ? (
                  <tr key={idx} style={{ background: "rgba(212,160,23,0.06)", borderBottom: "1px solid rgba(212,160,23,0.15)" }}>
                    <td className="px-4 py-2 text-[#d4a017] font-black text-sm">
                      <div className="flex items-center justify-center gap-1.5"><Edit2 size={12} className="animate-pulse" />{row.numero}</div>
                    </td>
                    {camposValores.map((f) => (
                      <td key={f} className="px-2 py-2">
                        <input type="number"
                          aria-label={`Editar ${f} da linha ${row.numero}`}
                          value={editRow?.[f] === 0 ? "" : editRow?.[f] || 0}
                          onChange={(e) => setEditRow({ ...editRow!, [f]: parseFloat(e.target.value) || 0 })}
                          onKeyDown={(e) => handleKeyDown(e, f, row.numero)}
                          className={inputStyle} autoFocus={f === "deposito"}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right font-mono text-sm font-black"
                      style={{ color: calc(editRow?.deposito||0,editRow?.redeposito||0,editRow?.saque||0,editRow?.bau||0) >= 0 ? "#4ade80" : "#f87171" }}
                    >
                      {fmt(calc(editRow?.deposito||0,editRow?.redeposito||0,editRow?.saque||0,editRow?.bau||0))}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1.5 justify-center">
                        <button onClick={handleEditSave}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black text-[#050b18]"
                          style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                        ><Check size={11} /> Salvar</button>
                        <button aria-label="Cancelar edição" onClick={() => { setEditingId(null); setEditRow(null); }}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white/40 border border-white/12 hover:bg-white/5"
                        ><X size={11} /></button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={idx} className={`planilha-linha-dados ${tdBorder}`}
                    style={{
                      background: ocultarValores ? "transparent" : row.resultado < 0 ? "rgba(248,113,113,0.04)" : row.resultado > 0 ? "rgba(74,222,128,0.04)" : "transparent",
                      cursor: ocultarValores ? undefined : "pointer",
                    }}
                    onClick={ocultarValores ? undefined : () => { setEditingId(row.numero); setEditRow({ ...row }); }}
                  >
                    <td className="px-4 py-3 text-white/40 font-bold text-sm">{row.numero}</td>
                    {[row.deposito, row.redeposito, row.saque, row.bau].map((v, i) => (
                      <td key={i} className={tdStyle}>{exibirValor(v)}</td>
                    ))}
                    <td className={`${tdStyle} font-black`}
                      style={{ color: ocultarValores ? undefined : row.resultado < 0 ? "#f87171" : row.resultado > 0 ? "#4ade80" : "rgba(255,255,255,0.5)" }}
                    >
                      {exibirValor(row.resultado)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!ocultarValores && <div className="planilha-acoes-linha flex gap-1.5 justify-center">
                        <button aria-label={`Editar linha ${row.numero}`} onClick={() => { setEditingId(row.numero); setEditRow({ ...row }); }}
                          className="planilha-acao-icone planilha-acao-editar w-7 h-7 rounded-lg flex items-center justify-center border transition-colors"
                        ><Edit2 size={18} /></button>
                        <button aria-label={`Excluir linha ${row.numero}`} onClick={e => { e.stopPropagation(); onDeleteRow(row.numero); }}
                          className="planilha-acao-icone planilha-acao-excluir w-7 h-7 rounded-lg flex items-center justify-center border transition-colors"
                        ><Trash2 size={18} /></button>
                      </div>}
                    </td>
                  </tr>
                )
              )}

              {/* Nova linha */}
              {!ocultarValores && <tr style={{ background: "rgba(212,160,23,0.04)", borderTop: "1px solid rgba(212,160,23,0.15)" }}>
                <td className="px-4 py-3 text-[#d4a017]/60 font-black text-sm">{newRow.numero}</td>
                {camposValores.map((f) => (
                  <td key={f} className="px-2 py-2">
                    <input type="number"
                      aria-label={`Novo ${f}`}
                      value={newRow[f] || ""}
                      onChange={(e) => setNewRow({ ...newRow, [f]: parseFloat(e.target.value) || 0 })}
                      onBlur={(e) => { if (!e.target.value) setNewRow({ ...newRow, [f]: 0 }); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddRow(); } }}
                      className={inputStyle} placeholder=""
                    />
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-mono text-sm font-black text-white/40">
                  {fmt(calc(newRow.deposito, newRow.redeposito, newRow.saque, newRow.bau))}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={handleAddRow}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-[#050b18] transition-all hover:scale-[1.02] mx-auto"
                    style={{ background: "linear-gradient(135deg, #d4a017, #f59e0b)" }}
                  ><Plus size={13} /> Adicionar</button>
                </td>
              </tr>}

              {/* Totais */}
              <tr className="planilha-linha-totais" style={{ background: "rgba(255,255,255,0.04)", borderTop: "2px solid rgba(255,255,255,0.1)" }}>
                <td className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-white/40">TOTAL</td>
                {[totals.deposito, totals.redeposito, totals.saque, totals.bau].map((v, i) => (
                  <td key={i} className="px-4 py-3 text-right font-mono text-sm font-black text-white/60">{exibirValor(v)}</td>
                ))}
                <td className="px-4 py-3 text-right font-mono text-base font-black"
                  style={{ color: ocultarValores ? undefined : totals.resultado < 0 ? "#f87171" : totals.resultado > 0 ? "#4ade80" : "rgba(255,255,255,0.5)" }}
                >
                  {exibirValor(totals.resultado)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-2 flex-wrap">
            <p className="text-[9px] text-white/45 dark:text-white/30">
              {ocultarValores ? "Valores ocultos. Revele os valores para editar." : "Dica: clique numa linha para editar · arraste a tabela para o lado no celular"}
            </p>
            {onRestoreRows && (
              <button
                onClick={desfazer}
                disabled={ocultarValores || !podeDesfazer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: "rgba(212,160,23,0.1)", color: "#f3d078", border: "1px solid rgba(212,160,23,0.3)" }}
                title="Desfazer a última ação (recupera linha excluída, edição, etc.)"
              >
                <Undo2 size={13} /> Desfazer
              </button>
            )}
          </div>
        </div>

        {/* Painel Lateral */}
        <div className="planilha-resumo min-w-0 space-y-3">
          {[
            { label: "TOTAL DEPÓSITO", value: totals.deposito, color: "#60a5fa" },
            { label: "TOTAL REDEPÓSITO", value: totals.redeposito, color: "#94a3b8" },
            { label: "TOTAL SAQUE", value: totals.saque, color: "#fb923c" },
            { label: "BAÚ", value: totals.bau, color: "#f59e0b" },
            {
              label: "%",
              value: totals.deposito > 0 ? ((cooperacao / totals.deposito) * 100).toFixed(2) + "%" : "0.00%",
              color: "#a78bfa", isText: true,
            },
          ].map(({ label, value, color, isText }) => (
            <div key={label} className="rounded-2xl p-4 border border-white/8 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15"
              style={{ background: "rgba(255,255,255,0.03)", borderLeft: `3px solid ${color}` }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                <p className="operacoes-neon text-[9px] font-black uppercase tracking-widest text-white/30">{label}</p>
              </div>
              <p className="planilha-total operacoes-valor-neon text-xl font-black"
                style={ocultarValores ? undefined : { "--operacoes-cor-valor": color, background: `linear-gradient(135deg, #ffffff 30%, ${color})`, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties}
              >
                {ocultarValores ? valorOculto : isText ? value : fmt(value as number)}
              </p>
            </div>
          ))}

          {/* Resultado */}
          <div className="rounded-2xl p-4 border overflow-hidden relative transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: ocultarValores ? "rgba(255,255,255,0.03)" : resultadoPositivo ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)",
              borderColor: ocultarValores ? "rgba(255,255,255,0.08)" : resultadoPositivo ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)",
            }}
          >
            {!ocultarValores && <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${resultadoPositivo ? "rgba(74,222,128,0.6)" : "rgba(248,113,113,0.6)"}, transparent)` }} />}
            <div className="flex items-center gap-1.5 mb-2">
              {!ocultarValores && (resultadoPositivo
                ? <TrendingUp size={14} className="text-emerald-400" />
                : <TrendingDown size={14} className="text-red-400" />
              )}
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: ocultarValores ? undefined : resultadoPositivo ? "#4ade80" : "#f87171" }}>
                RESULTADO
              </p>
            </div>
            <p className="planilha-total operacoes-valor-neon destaque text-2xl font-black" style={{ color: ocultarValores ? undefined : resultadoPositivo ? "#4ade80" : "#f87171" }}>
              {exibirValor(totals.resultado)}
            </p>
          </div>

          {/* Resultado Final + Cooperação */}
          <div className="rounded-2xl p-4 border overflow-hidden relative transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: ocultarValores ? "rgba(255,255,255,0.03)" : resultadoFinalPositivo ? "rgba(212,160,23,0.1)" : "rgba(248,113,113,0.08)",
              borderColor: ocultarValores ? "rgba(255,255,255,0.08)" : resultadoFinalPositivo ? "rgba(212,160,23,0.35)" : "rgba(248,113,113,0.3)",
            }}
          >
            {!ocultarValores && <>
              <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${resultadoFinalPositivo ? "rgba(212,160,23,0.7)" : "rgba(248,113,113,0.6)"}, transparent)` }} />
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl pointer-events-none" style={{ background: resultadoFinalPositivo ? "rgba(212,160,23,0.12)" : "rgba(248,113,113,0.1)" }} />
            </>}
            <p className="relative text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">{recarga ? "RESULTADO + SALÁRIO" : "RESULTADO + COOP."}</p>
            <p className="planilha-total operacoes-valor-neon destaque relative text-2xl font-black" style={ocultarValores ? undefined : { color: resultadoFinalPositivo ? "#d4a017" : "#f87171" }}>
              {exibirValor(resultadoFinal)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
