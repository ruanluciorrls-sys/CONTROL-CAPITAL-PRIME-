import React, { useState, useEffect, useCallback } from "react";
import { Edit2, RotateCcw, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ColorfulNameEditorProps {
  initialName: string;
  onNameChange?: (name: string) => void;
  backgroundImage?: string;
}

const COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#FFA07A", // Light Salmon
  "#98D8C8", // Mint
  "#F7DC6F", // Yellow
  "#BB8FCE", // Purple
  "#85C1E2", // Sky Blue
  "#F8B88B", // Peach
  "#A8E6CF", // Light Green
  "#FFD3B6", // Orange
  "#FFAAA5", // Pink
  "#FF8B94", // Rose
  "#A8D8EA", // Light Blue
  "#AA96DA", // Lavender
];

const EMOJIS = {
  default: ["✨", "🌟", "💫", "⭐", "🎨", "🎭", "🎪", "🎯", "🎲", "🎸"],
  dark: ["🌙", "🌑", "⭐", "✨", "💫", "🦇", "🕷️", "👻", "🎭", "🎪"],
  light: ["☀️", "🌞", "🌟", "✨", "💫", "🌈", "🎨", "🦋", "🌸", "🌺"],
  blue: ["💙", "🌊", "🐠", "🐟", "🦈", "🐳", "⛵", "🚤", "🌊", "💎"],
};

export default function ColorfulNameEditor({
  initialName,
  onNameChange,
  backgroundImage,
}: ColorfulNameEditorProps) {
  const [name, setName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const [colors, setColors] = useState<string[]>([]);
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const updateColorfulNameMutation = trpc.settings.updateColorfulName.useMutation();

  // Gerar cores aleatórias para cada letra
  const generateColors = (text: string) => {
    return text.split("").map(() => {
      return COLORS[Math.floor(Math.random() * COLORS.length)];
    });
  };

  // Gerar emojis aleatórios baseado no fundo
  const generateEmojis = () => {
    let emojiSet = EMOJIS.default;

    if (backgroundImage) {
      if (
        backgroundImage.toLowerCase().includes("dark") ||
        backgroundImage.toLowerCase().includes("night")
      ) {
        emojiSet = EMOJIS.dark;
      } else if (
        backgroundImage.toLowerCase().includes("light") ||
        backgroundImage.toLowerCase().includes("day")
      ) {
        emojiSet = EMOJIS.light;
      } else if (
        backgroundImage.toLowerCase().includes("blue") ||
        backgroundImage.toLowerCase().includes("water")
      ) {
        emojiSet = EMOJIS.blue;
      }
    }

    return Array.from({ length: 5 }, () => {
      return emojiSet[Math.floor(Math.random() * emojiSet.length)];
    });
  };

  // Inicializar cores e emojis
  useEffect(() => {
    setColors(generateColors(name));
    setSelectedEmojis(generateEmojis());
  }, []);

  // Regenerar cores quando o nome muda
  useEffect(() => {
    setColors(generateColors(name));
  }, [name]);

  // Auto-save para o servidor
  const saveToServer = useCallback(async () => {
    try {
      await updateColorfulNameMutation.mutateAsync({
        nomeColorido: name,
        coresColorido: colors,
        emojisColorido: selectedEmojis,
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  }, [name, colors, selectedEmojis, updateColorfulNameMutation]);

  // Salvar quando nome, cores ou emojis mudam
  useEffect(() => {
    if (colors.length > 0 && selectedEmojis.length > 0) {
      const timer = setTimeout(() => {
        saveToServer();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [name, colors, selectedEmojis, saveToServer]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    onNameChange?.(newName);
  };

  const handleRandomizeColors = () => {
    const newColors = generateColors(name);
    setColors(newColors);
  };

  const handleRandomizeEmojis = () => {
    const newEmojis = generateEmojis();
    setSelectedEmojis(newEmojis);
  };

  const handleReset = () => {
    setName(initialName);
    setColors(generateColors(initialName));
    setSelectedEmojis(generateEmojis());
    onNameChange?.(initialName);
  };

  return (
    <div className="w-full py-8 md:py-12 space-y-6">
      {/* Emojis decorativos no topo */}
      <div className="flex justify-center gap-3 text-3xl md:text-4xl flex-wrap">
        {selectedEmojis.map((emoji, idx) => (
          <span key={idx} className="animate-bounce" style={{ animationDelay: `${idx * 0.1}s` }}>
            {emoji}
          </span>
        ))}
      </div>

      {/* Nome grande e colorido */}
      <div className="text-center space-y-6">
        <div className="text-6xl md:text-8xl font-black tracking-wider drop-shadow-2xl">
          {name.split("").map((char, idx) => (
            <span
              key={idx}
              style={{
                color: colors[idx] || "#000",
                textShadow: `2px 2px 4px rgba(0,0,0,0.3), -2px -2px 4px rgba(255,255,255,0.3)`,
              }}
              className="inline-block transition-all duration-300 hover:scale-110 cursor-pointer"
            >
              {char}
            </span>
          ))}
        </div>

        {/* Botões de controle */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium min-h-[44px]"
          >
            <Edit2 size={18} />
            {isEditing ? "Pronto" : "Editar"}
          </button>

          <button
            onClick={handleRandomizeColors}
            className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium min-h-[44px]"
          >
            <Sparkles size={18} />
            Cores
          </button>

          <button
            onClick={handleRandomizeEmojis}
            className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium min-h-[44px]"
          >
            ✨ Emojis
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium min-h-[44px]"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>

        {/* Input de edição */}
        {isEditing && (
          <div className="mt-6 max-w-md mx-auto">
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-slate-800 dark:text-white min-h-[44px]"
              placeholder="Digite o nome..."
              autoFocus
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Máximo 20 caracteres
            </p>
          </div>
        )}
      </div>

      {/* Emojis decorativos na base */}
      <div className="flex justify-center gap-3 text-3xl md:text-4xl flex-wrap">
        {selectedEmojis.map((emoji, idx) => (
          <span
            key={`bottom-${idx}`}
            className="animate-bounce"
            style={{ animationDelay: `${(4 - idx) * 0.1}s` }}
          >
            {emoji}
          </span>
        ))}
      </div>
    </div>
  );
}
