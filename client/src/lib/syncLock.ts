// Trava de edição: pausa a atualização automática (polling) enquanto o usuário
// está digitando/editando, evitando que a sincronização atrapalhe a edição.

let editando = false;
let timer: ReturnType<typeof setTimeout> | null = null;

export function setEditingActive(active: boolean): void {
  if (active) {
    editando = true;
    if (timer) { clearTimeout(timer); timer = null; }
  } else {
    // pequeno atraso para cobrir a troca entre um campo e outro
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { editando = false; timer = null; }, 2500);
  }
}

export function isEditingActive(): boolean {
  return editando;
}
