import React, { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";

interface ColorfulNameDisplayProps {
  defaultName?: string;
}

const EMOJIS = {
  default: ["✨", "🌟", "💫", "⭐", "🎨", "🎭", "🎪", "🎯", "🎲", "🎸"],
  dark: ["🌙", "🌑", "⭐", "✨", "💫", "🦇", "🕷️", "👻", "🎭", "🎪"],
  light: ["☀️", "🌞", "🌟", "✨", "💫", "🌈", "🎨", "🦋", "🌸", "🌺"],
  blue: ["💙", "🌊", "🐠", "🐟", "🦈", "🐳", "⛵", "🚤", "🌊", "💎"],
};

const COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
  "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B88B", "#A8E6CF",
  "#FFD3B6", "#FFAAA5", "#FF8B94", "#A8D8EA", "#AA96DA",
];

export default function ColorfulNameDisplay({ defaultName = "Juan Dark" }: ColorfulNameDisplayProps) {
  const { data: settings, isLoading } = trpc.settings.get.useQuery();

  // Usar dados do servidor se disponíveis, senão usar padrão
  const name = useMemo(() => {
    return settings?.nomeColorido || defaultName;
  }, [settings?.nomeColorido, defaultName]);

  const colors = useMemo(() => {
    if (settings?.coresColorido && settings.coresColorido.length > 0) {
      return settings.coresColorido;
    }
    // Gerar cores baseado no nome (determinístico, não aleatório)
    return name.split("").map((char, idx) => {
      const charCode = char.charCodeAt(0);
      return COLORS[(charCode + idx) % COLORS.length];
    });
  }, [settings?.coresColorido, name]);

  const emojis = useMemo(() => {
    if (settings?.emojisColorido && settings.emojisColorido.length > 0) {
      return settings.emojisColorido;
    }
    // Gerar emojis baseado no nome (determinístico)
    const defaultEmojis = EMOJIS.default;
    return name.split("").map((char, idx) => {
      const charCode = char.charCodeAt(0);
      return defaultEmojis[(charCode + idx) % defaultEmojis.length];
    });
  }, [settings?.emojisColorido, name]);

  // Se ainda está carregando, mostrar versão padrão
  if (isLoading) {
    return (
      <div className="space-y-6 text-center opacity-50">
        <div className="flex justify-center gap-2 flex-wrap">
          {[0, 1, 2, 3, 4].map((idx) => (
            <span key={idx} className="text-4xl md:text-5xl animate-pulse">
              ✨
            </span>
          ))}
        </div>
        <div className="text-6xl md:text-8xl font-black tracking-wider text-gray-400">
          {defaultName}
        </div>
        <div className="flex justify-center gap-2 flex-wrap">
          {[5, 6, 7, 8, 9].map((idx) => (
            <span key={idx} className="text-4xl md:text-5xl animate-pulse">
              ✨
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      {/* Emojis acima */}
      <div className="flex justify-center gap-2 flex-wrap">
        {emojis.slice(0, 5).map((emoji, idx) => (
          <span
            key={`emoji-top-${idx}`}
            className="text-4xl md:text-5xl animate-bounce"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* Nome colorido grande */}
      <div className="text-6xl md:text-8xl font-black tracking-wider">
        {name.split("").map((char, idx) => (
          <span
            key={`char-${idx}`}
            style={{
              color: colors[idx] || "#000",
              textShadow: `2px 2px 4px rgba(0,0,0,0.3)`,
            }}
            className="inline-block transition-all duration-300 hover:scale-110 cursor-default"
          >
            {char}
          </span>
        ))}
      </div>

      {/* Emojis abaixo */}
      <div className="flex justify-center gap-2 flex-wrap">
        {emojis.slice(5, 10).map((emoji, idx) => (
          <span
            key={`emoji-bottom-${idx}`}
            className="text-4xl md:text-5xl animate-bounce"
            style={{ animationDelay: `${(idx + 5) * 0.1}s` }}
          >
            {emoji}
          </span>
        ))}
      </div>
    </div>
  );
}
