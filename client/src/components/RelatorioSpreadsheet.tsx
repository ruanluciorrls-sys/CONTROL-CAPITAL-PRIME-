import { useState, useEffect } from "react";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Plus, Trash2, Edit2 } from "lucide-react";

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
  cooperacao: number;
  onCooperacaoChange: (valor: number) => void;
  linkContaFilha?: string;
  media?: number;
  meta?: number;
  rows: RelatorioRow[];
  onAddRow: (row: RelatorioRow) => void;
  onDeleteRow: (numero: number) => void;
  onUpdateRow: (numero: number, row: RelatorioRow) => void;
}

export default function RelatorioSpreadsheet({
  casaNome,
  agente,
  prazo,
  cooperacao,
  onCooperacaoChange,
  linkContaFilha,
  media = 0,
  meta = 0,
  rows,
  onAddRow,
  onDeleteRow,
  onUpdateRow,
}: RelatorioSpreadsheetProps) {
  const [newRow, setNewRow] = useState<RelatorioRow>({
    numero: rows.length + 1,
    deposito: 0,
    redeposito: 0,
    saque: 0,
    bau: 0,
    resultado: 0,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<RelatorioRow | null>(null);
  const [cooperacaoInput, setCooperacaoInput] = useState(cooperacao === undefined || isNaN(cooperacao) ? '0' : cooperacao.toString());
  const [isSaving, setIsSaving] = useState(false);

  const { triggerSave } = useAutoSave({
    onSave: async () => {
      const cooperacaoNum = parseFloat(cooperacaoInput);
      if (!isNaN(cooperacaoNum) && cooperacaoNum !== cooperacao) {
        onCooperacaoChange(cooperacaoNum);
      }
    },
    delay: 800,
    onSaving: setIsSaving,
  });

  useEffect(() => {
    triggerSave();
  }, [cooperacaoInput, triggerSave]);

  useEffect(() => {
    triggerSave();
  }, [rows, triggerSave]);

  useEffect(() => {
    const cooperacaoNum = cooperacao === undefined || isNaN(cooperacao) ? '0' : cooperacao.toString();
    setCooperacaoInput(cooperacaoNum);
  }, [cooperacao]);

  useEffect(() => {
    setNewRow({
      numero: rows.length + 1,
      deposito: 0,
      redeposito: 0,
      saque: 0,
      bau: 0,
      resultado: 0,
    });
  }, [rows.length]);

  const calculateResultado = (deposito: number, redeposito: number, saque: number, bau: number): number => {
    return saque - deposito - redeposito + bau;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleAddRow = () => {
    const resultado = calculateResultado(newRow.deposito, newRow.redeposito, newRow.saque, newRow.bau);
    onAddRow({
      ...newRow,
      resultado,
    });
    setNewRow({
      numero: rows.length + 2,
      deposito: 0,
      redeposito: 0,
      saque: 0,
      bau: 0,
      resultado: 0,
    });
  };

  const handleEditStart = (row: RelatorioRow) => {
    setEditingId(row.numero);
    setEditRow({ ...row });
  };

  const handleEditSave = () => {
    if (editRow && editingId !== null) {
      // Validar e corrigir valores NaN
      const deposito = isNaN(editRow.deposito) ? 0 : editRow.deposito;
      const redeposito = isNaN(editRow.redeposito) ? 0 : editRow.redeposito;
      const saque = isNaN(editRow.saque) ? 0 : editRow.saque;
      const bau = isNaN(editRow.bau) ? 0 : editRow.bau;
      
      const resultado = calculateResultado(deposito, redeposito, saque, bau);
      onUpdateRow(editingId, {
        ...editRow,
        deposito,
        redeposito,
        saque,
        bau,
        resultado,
      });
      setEditingId(null);
      setEditRow(null);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditRow(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'deposito' | 'redeposito' | 'saque' | 'bau', rowNumero: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Salvar a linha atual
      handleEditSave();
      
      // Encontrar a próxima linha e iniciar edição
      const currentRowIndex = rows.findIndex(r => r.numero === rowNumero);
      if (currentRowIndex < rows.length - 1) {
        const nextRow = rows[currentRowIndex + 1];
        setTimeout(() => {
          handleEditStart(nextRow);
        }, 50);
      }
    }
  };

  const handleCooperacaoSave = () => {
    const cooperacaoNum = parseFloat(cooperacaoInput);
    if (!isNaN(cooperacaoNum)) {
      onCooperacaoChange(cooperacaoNum);
    }
  };

  const totals = {
    deposito: rows.reduce((sum, r) => sum + (r.deposito || 0) + (r.redeposito || 0), 0),
    redeposito: rows.reduce((sum, r) => sum + (r.redeposito || 0), 0),
    saque: rows.reduce((sum, r) => sum + (r.saque || 0), 0),
    bau: rows.reduce((sum, r) => sum + (r.bau || 0), 0),
    resultado: rows.reduce((sum, r) => sum + (r.resultado || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Indicador de Salvamento Automático */}
      {isSaving && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div>
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Salvando alterações...</p>
        </div>
      )}

      {/* Header com Informações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg border-2 border-yellow-300">
          <p className="font-bold text-lg text-gray-800 dark:text-yellow-100">AGENTE: {agente}</p>
          <p className="font-bold text-lg text-gray-800 dark:text-yellow-100">PRAZO: {prazo}</p>
        </div>
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg border-2 border-green-300 flex items-center justify-center">
          <p className="font-bold text-2xl text-gray-800 dark:text-green-100">{casaNome}</p>
        </div>
        <div></div>
      </div>

      {/* Cards de DEP, Montante e Link da Conta-Filha */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border-2 border-blue-300">
          <p className="text-sm font-semibold text-gray-700 dark:text-blue-100 mb-2">Quantidade de DEP</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{meta}</p>
          <p className="text-xs text-gray-600 dark:text-blue-200 mt-2">DEPs necessarios</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg border-2 border-green-300">
          <p className="text-sm font-semibold text-gray-700 dark:text-green-100 mb-2">Montante a Atingir</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-300">R$ {isNaN(meta * media) ? '0.00' : (meta * media).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-600 dark:text-green-200 mt-2">Prazo: {prazo}</p>
        </div>
        {linkContaFilha && (
          <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg border-2 border-purple-300">
            <p className="text-sm font-semibold text-gray-700 dark:text-purple-100 mb-2">Link da Conta-Filha</p>
            <div className="flex items-center gap-2 mt-2">
              <a
                href={linkContaFilha}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 underline text-xs flex-1 break-all"
              >
                Acessar
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(linkContaFilha);
                  alert('Link copiado!');
                }}
                className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors whitespace-nowrap"
              >
                Copiar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Layout Principal: Tabela + Painel Lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabela */}
        <div className="lg:col-span-3">
          <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg border border-gray-300 dark:border-slate-600 shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-700 dark:bg-gray-800 text-white">
                  <th className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-left font-bold">#</th>
                  <th className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-bold">Depósito</th>
                  <th className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-bold">ReDepósito</th>
                  <th className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-bold">Saque</th>
                  <th className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-bold">Baú</th>
                  <th className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-bold">Resultado</th>
                  <th className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-center font-bold">Ação</th>
                </tr>
              </thead>
              <tbody>
                {/* Linhas existentes */}
                {rows.map((row) =>
                  editingId === row.numero ? (
                    <tr key={row.numero} className="bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-600 dark:border-blue-400 shadow-md">
                      <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Edit2 size={18} className="text-blue-600 dark:text-blue-400 animate-pulse" />
                        {row.numero}
                      </td>
                      <td className="border border-gray-300 dark:border-slate-600 px-4 py-3">
                        <input
                          type="number"
                          value={editRow?.deposito === 0 ? "" : editRow?.deposito || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setEditRow({
                              ...editRow!,
                              deposito: isNaN(val) ? 0 : val,
                            });
                          }}
                          onKeyDown={(e) => handleKeyDown(e, 'deposito', row.numero)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 dark:text-white"
                          autoFocus
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-slate-600 px-4 py-3">
                        <input
                          type="number"
                          value={editRow?.redeposito === 0 ? "" : editRow?.redeposito || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setEditRow({
                              ...editRow!,
                              redeposito: isNaN(val) ? 0 : val,
                            });
                          }}
                          onKeyDown={(e) => handleKeyDown(e, 'redeposito', row.numero)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 dark:text-white"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-slate-600 px-4 py-3">
                        <input
                          type="number"
                          value={editRow?.saque === 0 ? "" : editRow?.saque || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setEditRow({
                              ...editRow!,
                              saque: isNaN(val) ? 0 : val,
                            });
                          }}
                          onKeyDown={(e) => handleKeyDown(e, 'saque', row.numero)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 dark:text-white"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-slate-600 px-4 py-3">
                        <input
                          type="number"
                          value={editRow?.bau === 0 ? "" : editRow?.bau || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setEditRow({
                              ...editRow!,
                              bau: isNaN(val) ? 0 : val,
                            });
                          }}
                          onKeyDown={(e) => handleKeyDown(e, 'bau', row.numero)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 dark:text-white"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-mono font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(
                          calculateResultado(
                            editRow?.deposito || 0,
                            editRow?.redeposito || 0,
                            editRow?.saque || 0,
                            editRow?.bau || 0
                          )
                        )}
                      </td>
                      <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-center flex gap-1 justify-center">
                        <button
                          onClick={handleEditSave}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors text-sm"
                        >
                          Cancelar
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr 
                      key={row.numero} 
                      className={`hover:bg-opacity-80 transition-colors ${
                        row.resultado < 0 
                          ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' 
                          : row.resultado > 0
                          ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
                      onDoubleClick={() => handleEditStart(row)}
                    >
                      <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 font-semibold text-gray-900 dark:text-white">{row.numero}</td>
                      <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                        {formatCurrency(row.deposito)}
                      </td>
                      <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                        {formatCurrency(row.redeposito)}
                      </td>
                      <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                        {formatCurrency(row.saque)}
                      </td>
                      <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-mono text-gray-700 dark:text-gray-300">
                        {formatCurrency(row.bau)}
                      </td>
                      <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-mono font-semibold text-gray-700 dark:text-gray-300">
                        {formatCurrency(row.resultado)}
                      </td>
                      <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-center flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditStart(row)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDeleteRow(row.numero)}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Deletar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                )}

                {/* Nova linha */}
                <tr key="new-row" className="bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-300 dark:border-blue-700">
                  <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 font-semibold text-gray-900 dark:text-white">{newRow.numero}</td>
                  <td className="border border-gray-300 dark:border-slate-600 px-4 py-3">
                    <input
                      type="number"
                      value={newRow.deposito || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setNewRow({
                          ...newRow,
                          deposito: isNaN(val) ? 0 : val,
                        });
                      }}
                      onBlur={(e) => {
                        if (e.target.value === "") {
                          setNewRow({ ...newRow, deposito: 0 });
                        }
                      }}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 dark:text-white"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-gray-300 dark:border-slate-600 px-4 py-3">
                    <input
                      type="number"
                      value={newRow.redeposito || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setNewRow({
                          ...newRow,
                          redeposito: isNaN(val) ? 0 : val,
                        });
                      }}
                      onBlur={(e) => {
                        if (e.target.value === "") {
                          setNewRow({ ...newRow, redeposito: 0 });
                        }
                      }}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 dark:text-white"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-gray-300 dark:border-slate-600 px-4 py-3">
                    <input
                      type="number"
                      value={newRow.saque || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setNewRow({
                          ...newRow,
                          saque: isNaN(val) ? 0 : val,
                        });
                      }}
                      onBlur={(e) => {
                        if (e.target.value === "") {
                          setNewRow({ ...newRow, saque: 0 });
                        }
                      }}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 dark:text-white"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-gray-300 dark:border-slate-600 px-4 py-3">
                    <input
                      type="number"
                      value={newRow.bau || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setNewRow({
                          ...newRow,
                          bau: isNaN(val) ? 0 : val,
                        });
                      }}
                      onBlur={(e) => {
                        if (e.target.value === "") {
                          setNewRow({ ...newRow, bau: 0 });
                        }
                      }}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 dark:text-white"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-mono font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(
                      calculateResultado(newRow.deposito, newRow.redeposito, newRow.saque, newRow.bau)
                    )}
                  </td>
                  <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-center">
                    <button
                      onClick={handleAddRow}
                      className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      Adicionar
                    </button>
                  </td>
                </tr>

                {/* Linha de Totais */}
                <tr className="bg-yellow-100 dark:bg-yellow-900/30 border-t-2 border-yellow-400 dark:border-yellow-600 font-bold">
                  <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-center font-bold text-gray-900 dark:text-white">TOTAL</td>
                  <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                    {formatCurrency(totals.deposito)}
                  </td>
                  <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                    {formatCurrency(totals.redeposito)}
                  </td>
                  <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                    {formatCurrency(totals.saque)}
                  </td>
                  <td className="border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
                    {formatCurrency(totals.bau)}
                  </td>
                  <td className={`border border-gray-300 dark:border-slate-600 px-4 py-3 text-right font-mono font-bold ${
                    totals.resultado < 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : totals.resultado > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {formatCurrency(totals.resultado)}
                  </td>
                  <td className="border border-gray-300 dark:border-slate-600 px-4 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Painel Lateral com Totalizações */}
        <div className="space-y-4">
          {/* Cooperação Fixa */}
          <div className="bg-purple-600 dark:bg-purple-700 text-white p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">COOPERAÇÃO</p>
            <p className="text-sm mb-3">VALOR FIXO</p>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                value={cooperacaoInput || '0'}
                onChange={(e) => setCooperacaoInput(e.target.value || '0')}
                className="flex-1 px-2 py-2 rounded text-black text-sm dark:bg-slate-700 dark:text-white"
              />
              <button
                onClick={handleCooperacaoSave}
                className="px-3 py-2 bg-white text-purple-600 dark:bg-slate-700 dark:text-white rounded font-semibold hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors text-sm"
              >
                OK
              </button>
            </div>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(cooperacao)}
            </p>
            {meta > 0 && media > 0 && (
              <div className="mt-4 pt-4 border-t border-purple-400">
                <p className="text-xs font-semibold mb-2">Progresso do Montante</p>
                <div className="w-full bg-purple-400 dark:bg-purple-500 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-300"
                    style={{
                      width: `${isNaN((totals.deposito / (meta * media)) * 100) ? 0 : Math.min((totals.deposito / (meta * media)) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs mt-2">
                  {isNaN((totals.deposito / (meta * media)) * 100) ? '0.0' : ((totals.deposito / (meta * media)) * 100).toFixed(1)}% de R$ {isNaN(meta * media) ? '0.00' : (meta * media).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>

          {/* Total Depósito */}
          <div className="bg-gray-500 dark:bg-gray-600 text-white p-4 rounded-lg">
            <p className="text-sm font-semibold">TOTAL DEPÓSITO</p>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(totals.deposito)}
            </p>
          </div>

          {/* Total ReDepósito */}
          <div className="bg-gray-500 dark:bg-gray-600 text-white p-4 rounded-lg">
            <p className="text-sm font-semibold">TOTAL REDEPÓSITO</p>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(totals.redeposito)}
            </p>
          </div>

          {/* Total Saque */}
          <div className="bg-gray-500 dark:bg-gray-600 text-white p-4 rounded-lg">
            <p className="text-sm font-semibold">TOTAL SAQUE</p>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(totals.saque)}
            </p>
          </div>

          {/* Baú */}
          <div className="bg-gray-500 dark:bg-gray-600 text-white p-4 rounded-lg">
            <p className="text-sm font-semibold">BAÚ</p>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(totals.bau)}
            </p>
          </div>

          {/* Percentual */}
          <div className="bg-gray-500 dark:bg-gray-600 text-white p-4 rounded-lg">
            <p className="text-sm font-semibold">%</p>
            <p className="text-2xl font-bold mt-2">
              {totals.deposito > 0
                ? ((cooperacao / totals.deposito) * 100).toFixed(2)
                : "0.00"}
              %
            </p>
          </div>

          {/* Resultado Final */}
          <div
            className={`${
              totals.resultado >= 0 ? "bg-green-600 dark:bg-green-700" : "bg-red-600 dark:bg-red-700"
            } text-white p-4 rounded-lg border-2 border-gray-800 dark:border-gray-900`}
          >
            <p className="text-sm font-semibold">RESULTADO</p>
            <p className="text-3xl font-bold mt-2">
              {formatCurrency(totals.resultado)}
            </p>
          </div>

          {/* Resultado Final com Cooperacao */}
          <div
            className={`${
              (totals.resultado + cooperacao) >= 0 ? "bg-blue-600 dark:bg-blue-700" : "bg-purple-600 dark:bg-purple-700"
            } text-white p-4 rounded-lg border-2 border-gray-800 dark:border-gray-900`}
          >
            <p className="text-sm font-semibold">RESULTADO FINAL + COOPERACAO</p>
            <p className="text-3xl font-bold mt-2">
              {(totals.resultado + cooperacao) < 0 ? "-" : ""}
              {formatCurrency(totals.resultado + cooperacao)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
