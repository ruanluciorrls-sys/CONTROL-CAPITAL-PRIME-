import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit2, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GastoProxy() {
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: gastos = [], refetch } = trpc.gastosProxy.list.useQuery();
  const { data: totalGastos = 0 } = trpc.gastosProxy.total.useQuery();

  const createMutation = trpc.gastosProxy.create.useMutation({
    onSuccess: () => {
      refetch();
      setValor("");
      setDescricao("");
      setData(format(new Date(), "yyyy-MM-dd"));
    },
  });

  const updateMutation = trpc.gastosProxy.update.useMutation({
    onSuccess: () => {
      refetch();
      setValor("");
      setDescricao("");
      setData(format(new Date(), "yyyy-MM-dd"));
      setEditingId(null);
    },
  });

  const deleteMutation = trpc.gastosProxy.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || !data) return;

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        valor,
        descricao: descricao || undefined,
        data,
      });
    } else {
      await createMutation.mutateAsync({
        valor,
        descricao: descricao || undefined,
        data,
      });
    }
  };

  const handleEdit = (gasto: any) => {
    setEditingId(gasto.id);
    setValor(gasto.valor.toString());
    setDescricao(gasto.descricao || "");
    setData(gasto.data);
  };

  const handleCancel = () => {
    setEditingId(null);
    setValor("");
    setDescricao("");
    setData(format(new Date(), "yyyy-MM-dd"));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gasto com Proxy</h1>
        <p className="text-muted-foreground mt-2">Registre e acompanhe seus gastos com proxy</p>
      </div>

      {/* Card de Total */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 border-0">
        <CardHeader>
          <CardTitle className="text-white">Total de Gastos com Proxy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-white">
            R$ {totalGastos.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </CardContent>
      </Card>

      {/* Formulário */}
      <Card className="bg-card backdrop-blur-sm border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>{editingId ? "Editar Gasto" : "Adicionar Novo Gasto"}</CardTitle>
          <CardDescription>Preencha os dados do gasto com proxy</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Valor (R$)*</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data*</label>
                <Input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  type="text"
                  placeholder="Ex: Proxy servidor X"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Plus className="w-4 h-4 mr-2" />
                {editingId ? "Atualizar" : "Adicionar"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Gastos */}
      <Card className="bg-card backdrop-blur-sm border-border/50 shadow-lg mt-6">
        <CardHeader>
          <CardTitle>Histórico de Gastos</CardTitle>
          <CardDescription>{gastos.length} gasto(s) registrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {gastos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum gasto registrado ainda</p>
          ) : (
            <div className="space-y-2">
              {gastos.map((gasto: any) => (
                <div
                  key={gasto.id}
                  className="flex items-center justify-between p-4 border border-border/60 rounded-xl hover:bg-muted/30 transition shadow-sm"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      R$ {gasto.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(gasto.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      {gasto.descricao && ` - ${gasto.descricao}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(gasto)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutateAsync({ id: gasto.id })}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
