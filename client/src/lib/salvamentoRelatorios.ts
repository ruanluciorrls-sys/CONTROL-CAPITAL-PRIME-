export type SalvamentoRelatorio =
  | { status: "salvando" | "erro"; salvoEm?: never }
  | { status: "salvo"; salvoEm: string };

export type SalvamentoRelatorios = Record<string, SalvamentoRelatorio | undefined>;

export function criarFilaSalvamentoRelatorios<Patch extends { id: string }>(
  publicar: (id: string, salvamento: SalvamentoRelatorio) => void,
  reconciliar: () => void,
) {
  const pendentes = new Map<string, Promise<void>>();
  const camposComErro = new Map<string, Set<string>>();
  let precisaReconciliar = false;

  const solicitarReconciliacao = () => {
    if (pendentes.size > 0) precisaReconciliar = true;
    else reconciliar();
  };

  const enfileirar = (patch: Patch, gravar: (patch: Patch) => Promise<{ success: boolean }>) => {
    const { id, ...dados } = patch;
    const campos = Object.keys(dados).filter(campo => dados[campo as keyof typeof dados] !== undefined);
    if (!campos.length) return Promise.resolve();

    // Serializa apenas o mesmo ID: rows e outros campos podem ser sobrescritos integralmente.
    const anterior = pendentes.get(id) ?? Promise.resolve();
    let confirmado = false;
    const tarefa = anterior.then(async () => {
      const falhas = camposComErro.get(id) ?? new Set<string>();
      try {
        const resposta = await gravar(patch);
        if (resposta?.success !== true) throw new Error("Gravacao sem confirmacao");
        confirmado = true;
        campos.forEach(campo => falhas.delete(campo));
      } catch {
        campos.forEach(campo => falhas.add(campo));
        precisaReconciliar = true;
      }

      if (falhas.size) camposComErro.set(id, falhas);
      else camposComErro.delete(id);

      // Um sucesso parcial ou antigo nao confirma as outras alteracoes do relatorio.
      if (pendentes.get(id) !== tarefa) return;
      pendentes.delete(id);
      publicar(id, falhas.size ? { status: "erro" } : { status: "salvo", salvoEm: new Date().toISOString() });

      if (!pendentes.size && precisaReconciliar) {
        precisaReconciliar = false;
        reconciliar();
      }
    });

    pendentes.set(id, tarefa);
    publicar(id, { status: "salvando" });
    return tarefa.then(() => confirmado);
  };

  return { enfileirar, solicitarReconciliacao };
}
