import { useCallback, useEffect, useState } from "react";
import {
  createPart,
  deletePart,
  listParts,
  updatePart,
} from "../api/parts";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PartFormModal } from "../components/PartFormModal";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Pagination } from "../components/ui/Pagination";
import { Spinner } from "../components/ui/Spinner";
import type { Part, PartInput } from "../types";

const PAGE_SIZE = 10;

export function PartsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [parts, setParts] = useState<Part[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingPart, setEditingPart] = useState<Part | null | undefined>(
    undefined,
  );
  const [deletingPart, setDeletingPart] = useState<Part | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listParts({
        page,
        limit: PAGE_SIZE,
        category: category || undefined,
      });
      setParts(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível carregar as peças",
      );
    } finally {
      setLoading(false);
    }
  }, [page, category]);

  useEffect(() => {
    void fetchParts();
  }, [fetchParts]);

  async function handleCreateOrUpdate(input: PartInput) {
    if (editingPart) {
      await updatePart(editingPart.id, input);
    } else {
      await createPart(input);
    }
    setEditingPart(undefined);
    await fetchParts();
  }

  async function handleDelete() {
    if (!deletingPart) return;
    setDeleting(true);
    try {
      await deletePart(deletingPart.id);
      setDeletingPart(null);
      await fetchParts();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível excluir a peça",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-karhub-navy">Peças</h1>
          <p className="text-sm text-gray-500">
            {total} peça{total === 1 ? "" : "s"} cadastrada{total === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex items-end gap-3">
          <Input
            id="category-filter"
            label="Categoria"
            placeholder="Filtrar..."
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
          />
          {isAdmin && (
            <Button onClick={() => setEditingPart(null)} className="shrink-0">
              + Nova peça
            </Button>
          )}
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium tracking-wide text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-right">Estoque</th>
              <th className="px-4 py-3 text-right">Mínimo</th>
              <th className="px-4 py-3 text-right">Venda/dia</th>
              <th className="px-4 py-3 text-right">Lead time</th>
              <th className="px-4 py-3 text-right">Criticidade</th>
              {isAdmin && <th className="px-4 py-3 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <Spinner className="mx-auto" />
                </td>
              </tr>
            ) : parts.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  Nenhuma peça encontrada.
                </td>
              </tr>
            ) : (
              parts.map((part) => (
                <tr key={part.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-karhub-navy">
                    {part.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{part.category}</td>
                  <td className="px-4 py-3 text-right">{part.currentStock}</td>
                  <td className="px-4 py-3 text-right">{part.minimumStock}</td>
                  <td className="px-4 py-3 text-right">
                    {part.averageDailySales}
                  </td>
                  <td className="px-4 py-3 text-right">{part.leadTimeDays}d</td>
                  <td className="px-4 py-3 text-right">
                    {part.criticalityLevel}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setEditingPart(part)}
                        className="mr-3 font-medium text-karhub-navy hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingPart(part)}
                        className="font-medium text-red-600 hover:underline"
                      >
                        Excluir
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {editingPart !== undefined && (
        <PartFormModal
          part={editingPart}
          onClose={() => setEditingPart(undefined)}
          onSubmit={handleCreateOrUpdate}
        />
      )}

      {deletingPart && (
        <ConfirmDialog
          title="Excluir peça"
          message={`Tem certeza que deseja excluir "${deletingPart.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingPart(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
