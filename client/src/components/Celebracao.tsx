import { useEffect, useRef, useState } from "react";

const MENSAGENS = [
  "Parabéns pelo lucro! 🎉",
  "Boa! Mais lucro na conta 💚",
  "Lucro garantido! 🤑",
  "Tá voando! 🚀",
  "Mandou bem demais! 🔥",
  "Dinheiro entrando! 💰",
  "Isso, continua assim! 🏆",
  "Que máquina de lucro! ⚡",
];

const CORES = ["#4ade80", "#22c55e", "#d4a017", "#f6b51b", "#a7f3c8", "#86efac", "#f3d078"];

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

type Peça = { id: number; left: number; delay: number; dur: number; cor: string; size: number; rot: number };
type Estado = { valor?: number; mensagem: string; pieces: Peça[] } | null;

/** Overlay global de comemoração — escuta o evento "cpa-celebrar". */
export default function Celebracao() {
  const [ativo, setAtivo] = useState<Estado>(null);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const mensagem = detail.mensagem || MENSAGENS[Math.floor(Math.random() * MENSAGENS.length)];
      const pieces: Peça[] = Array.from({ length: 70 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        dur: 2 + Math.random() * 1.6,
        cor: CORES[Math.floor(Math.random() * CORES.length)],
        size: 6 + Math.random() * 9,
        rot: Math.random() * 360,
      }));
      setAtivo({ valor: detail.valor, mensagem, pieces });
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setAtivo(null), 3800);
    };
    window.addEventListener("cpa-celebrar", handler);
    return () => { window.removeEventListener("cpa-celebrar", handler); window.clearTimeout(timerRef.current); };
  }, []);

  if (!ativo) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      <style>{`
        @keyframes cpaFall { 0% { transform: translateY(-12vh) rotate(0deg); opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(112vh) rotate(720deg); opacity: 0.9; } }
        @keyframes cpaPop { 0% { transform: scale(0.6) translateY(14px); opacity: 0; } 15% { transform: scale(1.08) translateY(0); opacity: 1; } 82% { transform: scale(1) translateY(0); opacity: 1; } 100% { transform: scale(0.95) translateY(-8px); opacity: 0; } }
        @keyframes cpaGlow { 0%,100% { opacity: .35; } 50% { opacity: .6; } }
      `}</style>

      {/* Confete */}
      {ativo.pieces.map((p) => (
        <div key={p.id} className="absolute top-0 rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.5,
            background: p.cor,
            boxShadow: `0 0 6px ${p.cor}66`,
            animation: `cpaFall ${p.dur}s linear ${p.delay}s forwards`,
          }}
        />
      ))}

      {/* Card de parabéns */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative rounded-3xl px-8 py-6 text-center border"
          style={{
            background: "linear-gradient(145deg, rgba(6,26,18,0.96), rgba(7,33,56,0.94))",
            borderColor: "rgba(74,222,128,0.45)",
            boxShadow: "0 25px 70px rgba(74,222,128,0.28)",
            animation: "cpaPop 3.8s ease-out forwards",
          }}
        >
          <div className="absolute -inset-8 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(74,222,128,0.25), transparent 70%)", animation: "cpaGlow 1.4s ease-in-out infinite" }} />
          <div className="relative">
            <div className="text-5xl mb-2">🎉</div>
            <p className="text-xl font-black" style={{ color: "#4ade80", textShadow: "0 0 24px rgba(74,222,128,0.5)" }}>
              {ativo.mensagem}
            </p>
            {typeof ativo.valor === "number" && ativo.valor > 0 && (
              <p className="mt-1 font-mono text-2xl font-black text-emerald-300">+{fmt(ativo.valor)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
