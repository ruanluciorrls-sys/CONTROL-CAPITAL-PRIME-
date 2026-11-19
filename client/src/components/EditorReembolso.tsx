import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { lerValorReembolso } from "@shared/reembolso";
import { moedaRelatorio } from "@/lib/visaoRelatorios";

export default function EditorReembolso({ valorInicial, resultado, ocupado, ocultarValores, gravar }: {
  valorInicial?: number | null;
  resultado: number;
  ocupado: boolean;
  ocultarValores: boolean;
  gravar: (valor: number, concluir: boolean) => Promise<void>;
}) {
  const [texto, setTexto] = useState(valorInicial == null ? "" : String(valorInicial).replace(".", ","));
  const [enviando, setEnviando] = useState(false);
  const valor = lerValorReembolso(texto);
  const final = Math.round((resultado + (valor ?? 0)) * 100) / 100;
  const enviar = async (concluir: boolean) => {
    if (valor === null || enviando || ocupado) return;
    setEnviando(true);
    try { await gravar(valor, concluir); } finally { setEnviando(false); }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-red-400/30 bg-red-400/5 p-4" aria-label="Editar reembolso">
      <div className="flex items-center gap-2 text-sm font-black text-red-300">
        <AlertTriangle size={18} /> Atenção: relatório em reembolso
      </div>
      {ocultarValores ? <p className="text-sm">Revele os valores para editar o reembolso.</p> : <>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold">Valor recebido (R$)
            <input className="mt-1 block min-h-11 w-full rounded-lg border border-white/15 bg-background px-3"
              inputMode="decimal" maxLength={11} value={texto} onChange={e => setTexto(e.target.value)} disabled={enviando}
              aria-invalid={texto !== "" && valor === null} placeholder="0,00" />
          </label>
          <div className="text-sm text-white/75">Resultado atual
            <p className="mt-1 text-xl font-black">{moedaRelatorio.format(resultado)}</p>
          </div>
          <div className="text-sm text-white/75">Resultado com reembolso
            <p className={`mt-1 text-xl font-black ${final < 0 ? "text-red-300" : "text-emerald-300"}`}>{moedaRelatorio.format(final)}</p>
          </div>
        </div>
        <p className="text-sm text-white/70">O valor recebido entra no resultado ao finalizar o relatório e a meta vinculada.</p>
        {texto !== "" && valor === null && <p role="alert" className="text-sm text-red-300">Informe um valor válido, com até duas casas decimais.</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={valor === null || ocupado || enviando} onClick={() => void enviar(false)}
            className="min-h-11 rounded-lg border border-white/20 px-4 text-sm font-bold disabled:opacity-45">Salvar reembolso</button>
          <button type="button" disabled={valor === null || ocupado || enviando} onClick={() => void enviar(true)}
            className="min-h-11 rounded-lg bg-emerald-400 px-4 text-sm font-black text-[#050b18] disabled:opacity-45">Finalizar reembolso e meta</button>
        </div>
      </>}
    </section>
  );
}
