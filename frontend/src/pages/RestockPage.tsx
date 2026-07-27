import { useCallback, useEffect, useState } from "react";
import { getRestockPriorities } from "../api/restock";
import { ApiError } from "../api/client";
import { Alert } from "../components/ui/Alert";
import { Pagination } from "../components/ui/Pagination";
import { Spinner } from "../components/ui/Spinner";
import type { RestockPriorityItem } from "../types";

const PAGE_SIZE = 10;

export function RestockPage() {
  const [priorities, setPriorities] = useState<RestockPriorityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPriorities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRestockPriorities(page, PAGE_SIZE);
      setPriorities(result.priorities);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível carregar as prioridades",
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchPriorities();
  }, [fetchPriorities]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-karhub-navy">
          Prioridades de reposição
        </h1>
        <p className="text-sm text-gray-500">
          {total} peça{total === 1 ? "" : "s"} precisando de reposição, ordenadas
          por urgência
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : priorities.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-16 text-center text-sm text-gray-500">
          Nenhuma peça precisa de reposição no momento. 🎉
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {priorities.map((item, index) => {
            const critical = item.projectedStock < 0;
            return (
              <li
                key={item.partId}
                className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-karhub-navy text-sm font-semibold text-white">
                    {(page - 1) * PAGE_SIZE + index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-karhub-navy">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      Estoque atual: {item.currentStock} · Mínimo:{" "}
                      {item.minimumStock}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Projetado</p>
                    <p
                      className={`text-sm font-semibold ${
                        critical ? "text-red-600" : "text-karhub-navy"
                      }`}
                    >
                      {item.projectedStock}
                    </p>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      critical
                        ? "bg-red-100 text-red-700"
                        : "bg-karhub-orange-light text-karhub-orange-dark"
                    }`}
                  >
                    urgência {item.urgencyScore}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
