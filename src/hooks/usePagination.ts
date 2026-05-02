import { useMemo, useState } from 'react';

export interface PaginationResult<T> {
  visible: T[];
  filtered: T[];
  page: number;
  hasMore: boolean;
  loadMore: () => void;
  /** Use no onChangeText do input de busca pra reset de página automático. */
  setQuery: (q: string) => void;
  query: string;
}

/**
 * Hook genérico de paginação client-side com busca textual.
 *
 * Útil pra listas potencialmente grandes (amigos, jogadores, etc).
 * Aplica o filtro de busca a partir do `searchKeys` do item, depois
 * pagina em chunks de `pageSize`.
 */
export const usePagination = <T>(
  items: T[],
  searchKeys: (item: T) => string[],
  pageSize = 30,
): PaginationResult<T> => {
  const [query, setQueryRaw] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => searchKeys(it).some((k) => k.toLowerCase().includes(q)));
  }, [items, query, searchKeys]);

  const visible = useMemo(() => filtered.slice(0, page * pageSize), [filtered, page, pageSize]);

  const setQuery = (q: string) => {
    setQueryRaw(q);
    setPage(1);
  };

  return {
    visible,
    filtered,
    page,
    hasMore: visible.length < filtered.length,
    loadMore: () => setPage((p) => p + 1),
    setQuery,
    query,
  };
};
