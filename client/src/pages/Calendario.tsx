import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, X } from "lucide-react";

interface Plataforma {
  id: string;
  nome: string;
  diasPrazo: number;
  dia: string;
}

const diasSemana = [
  "SEGUNDA-FEIRA",
  "TERÇA-FEIRA",
  "QUARTA-FEIRA",
  "QUINTA-FEIRA",
  "SEXTA-FEIRA",
  "SÁBADO",
  "DOMINGO",
];

const plataformasInicial: Plataforma[] = [
  { id: "1", nome: "WE", diasPrazo: 4, dia: "SEGUNDA-FEIRA" },
  { id: "2", nome: "777CLUBE", diasPrazo: 3, dia: "SEGUNDA-FEIRA" },
  { id: "3", nome: "EK", diasPrazo: 4, dia: "TERÇA-FEIRA" },
  { id: "4", nome: "VOY", diasPrazo: 4, dia: "TERÇA-FEIRA" },
  { id: "5", nome: "888", diasPrazo: 3, dia: "TERÇA-FEIRA" },
  { id: "6", nome: "MANGA", diasPrazo: 3, dia: "TERÇA-FEIRA" },
  { id: "7", nome: "ANJO", diasPrazo: 3, dia: "TERÇA-FEIRA" },
  { id: "8", nome: "GAME", diasPrazo: 6, dia: "TERÇA-FEIRA" },
  { id: "9", nome: "91", diasPrazo: 3, dia: "QUARTA-FEIRA" },
  { id: "10", nome: "OKOK", diasPrazo: 3, dia: "QUARTA-FEIRA" },
  { id: "11", nome: "A8", diasPrazo: 7, dia: "QUARTA-FEIRA" },
  { id: "12", nome: "DY", diasPrazo: 4, dia: "QUARTA-FEIRA" },
  { id: "13", nome: "MK", diasPrazo: 4, dia: "QUARTA-FEIRA" },
  { id: "14", nome: "WP", diasPrazo: 7, dia: "QUARTA-FEIRA" },
  { id: "15", nome: "W1", diasPrazo: 3, dia: "QUINTA-FEIRA" },
  { id: "16", nome: "DZ", diasPrazo: 0, dia: "QUINTA-FEIRA" },
  { id: "17", nome: "777CLUBE", diasPrazo: 4, dia: "QUINTA-FEIRA" },
  { id: "18", nome: "WE", diasPrazo: 3, dia: "SEXTA-FEIRA" },
  { id: "19", nome: "MANGA", diasPrazo: 4, dia: "SEXTA-FEIRA" },
  { id: "20", nome: "ANJO", diasPrazo: 4, dia: "SEXTA-FEIRA" },
  { id: "21", nome: "888", diasPrazo: 4, dia: "SEXTA-FEIRA" },
  { id: "22", nome: "VOY", diasPrazo: 3, dia: "SÁBADO" },
  { id: "23", nome: "91", diasPrazo: 4, dia: "SÁBADO" },
  { id: "24", nome: "EK", diasPrazo: 3, dia: "SÁBADO" },
  { id: "25", nome: "W1", diasPrazo: 4, dia: "DOMINGO" },
  { id: "26", nome: "DY", diasPrazo: 3, dia: "DOMINGO" },
  { id: "27", nome: "MK", diasPrazo: 3, dia: "DOMINGO" },
];

export default function Calendario() {
  const [plataformas, setPlataformas] = useState<Plataforma[]>(plataformasInicial);
  const [novaPlataforma, setNovaPlataforma] = useState({
    nome: "",
    diasPrazo: 0,
    dia: "SEGUNDA-FEIRA",
  });
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const handleAdicionarPlataforma = () => {
    if (novaPlataforma.nome.trim()) {
      const novaId = Date.now().toString();
      setPlataformas([
        ...plataformas,
        {
          id: novaId,
          nome: novaPlataforma.nome.toUpperCase(),
          diasPrazo: novaPlataforma.diasPrazo,
          dia: novaPlataforma.dia,
        },
      ]);
      setNovaPlataforma({ nome: "", diasPrazo: 0, dia: "SEGUNDA-FEIRA" });
    }
  };

  const handleDeletarPlataforma = (id: string) => {
    setPlataformas(plataformas.filter((p) => p.id !== id));
  };

  const handleEditarPlataforma = (id: string, campo: string, valor: any) => {
    setPlataformas(
      plataformas.map((p) =>
        p.id === id ? { ...p, [campo]: valor } : p
      )
    );
  };

  const plataformaEmEdicao = plataformas.find((p) => p.id === editandoId);

  const handleSalvarEdicao = () => {
    setEditandoId(null);
  };

  const plataformasPorDia = diasSemana.map((dia) => ({
    dia,
    plataformas: plataformas.filter((p) => p.dia === dia),
  }));

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            📅 Calendário de Lançamentos 2026
          </h1>
          <p className="text-muted-foreground">
            Controle de plataformas e prazos de entrega
          </p>
        </div>

        {/* Adicionar Nova Plataforma */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">
            ➕ Adicionar Nova Plataforma
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nome da Plataforma
              </label>
              <Input
                value={novaPlataforma.nome}
                onChange={(e) =>
                  setNovaPlataforma({
                    ...novaPlataforma,
                    nome: e.target.value,
                  })
                }
                placeholder="Ex: WE"
                className="bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Dias de Prazo
              </label>
              <Input
                type="number"
                value={novaPlataforma.diasPrazo}
                onChange={(e) =>
                  setNovaPlataforma({
                    ...novaPlataforma,
                    diasPrazo: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Ex: 3"
                className="bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Dia da Semana
              </label>
              <select
                value={novaPlataforma.dia}
                onChange={(e) =>
                  setNovaPlataforma({
                    ...novaPlataforma,
                    dia: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                {diasSemana.map((dia) => (
                  <option key={dia} value={dia}>
                    {dia}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAdicionarPlataforma}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2" size={18} />
                Adicionar
              </Button>
            </div>
          </div>
        </div>

        {/* Calendário */}
        <div className="space-y-6">
          {plataformasPorDia.map(({ dia, plataformas: plats }) => (
            <div key={dia} className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-2xl font-bold text-primary mb-4">
                {dia}
              </h3>
              {plats.length === 0 ? (
                <p className="text-muted-foreground italic">
                  Nenhuma plataforma neste dia
                </p>
              ) : (
                <div className="space-y-3">
                  {plats.map((plat) => (
                    <div
                      key={plat.id}
                      className="flex items-center justify-between bg-background p-4 rounded-lg border border-border hover:border-primary transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="font-bold text-lg text-foreground min-w-24">
                            {plat.nome}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {plat.diasPrazo === 0
                              ? "Sem prazo definido"
                              : `${plat.diasPrazo} DIAS PRAZO DE ENTREGA`}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditandoId(plat.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletarPlataforma(plat.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal de Edição */}
        {editandoId && plataformaEmEdicao && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-foreground mb-4">Editar Plataforma</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nome
                  </label>
                  <Input
                    value={plataformaEmEdicao.nome}
                    onChange={(e) =>
                      handleEditarPlataforma(editandoId, "nome", e.target.value.toUpperCase())
                    }
                    className="bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Dias de Prazo
                  </label>
                  <Input
                    type="number"
                    value={plataformaEmEdicao.diasPrazo}
                    onChange={(e) =>
                      handleEditarPlataforma(editandoId, "diasPrazo", parseInt(e.target.value) || 0)
                    }
                    className="bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Dia da Semana
                  </label>
                  <select
                    value={plataformaEmEdicao.dia}
                    onChange={(e) =>
                      handleEditarPlataforma(editandoId, "dia", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                  >
                    {diasSemana.map((dia) => (
                      <option key={dia} value={dia}>
                        {dia}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleSalvarEdicao}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Salvar
                </Button>
                <Button
                  onClick={() => setEditandoId(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Resumo */}
        <div className="mt-8 bg-green-500 text-white rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-2">📊 Resumo</h3>
          <p className="text-lg">
            Total de plataformas: <strong>{plataformas.length}</strong>
          </p>
          <p className="text-sm mt-2 opacity-90">
            OBS: OS DIAS CONTAR A PARTIR DO DIA SEGUINTE
          </p>
        </div>
      </div>
    </div>
  );
}
