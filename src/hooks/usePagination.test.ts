/**
 * Testes da lógica de paginação. Como usePagination usa hooks (useState/useMemo),
 * testamos a função extraída de filtro/slice em isolation.
 */

interface Item {
  id: string;
  name: string;
  email: string;
}

const filterAndPaginate = <T>(
  items: T[],
  query: string,
  searchKeys: (it: T) => string[],
  page: number,
  pageSize: number,
): { visible: T[]; filtered: T[]; hasMore: boolean } => {
  const q = query.trim().toLowerCase();
  const filtered = !q
    ? items
    : items.filter((it) => searchKeys(it).some((k) => k.toLowerCase().includes(q)));
  const visible = filtered.slice(0, page * pageSize);
  return { visible, filtered, hasMore: visible.length < filtered.length };
};

const seed: Item[] = [
  { id: '1', name: 'Ana Silva', email: 'ana@x.com' },
  { id: '2', name: 'Bruno Costa', email: 'bruno@y.com' },
  { id: '3', name: 'Carla Mendes', email: 'carla@x.com' },
  { id: '4', name: 'Daniel Oliveira', email: 'daniel@z.com' },
  { id: '5', name: 'Eduarda Lima', email: 'edu@x.com' },
];

const keys = (it: Item) => [it.name, it.email];

describe('filterAndPaginate', () => {
  it('sem query e cabe na página: visible == items, hasMore false', () => {
    const r = filterAndPaginate(seed, '', keys, 1, 10);
    expect(r.visible.length).toBe(5);
    expect(r.hasMore).toBe(false);
  });

  it('paginação: page 1 com pageSize 2 retorna 2 itens, hasMore true', () => {
    const r = filterAndPaginate(seed, '', keys, 1, 2);
    expect(r.visible.length).toBe(2);
    expect(r.hasMore).toBe(true);
    expect(r.filtered.length).toBe(5);
  });

  it('paginação: page 3 com pageSize 2 cobre tudo', () => {
    const r = filterAndPaginate(seed, '', keys, 3, 2);
    expect(r.visible.length).toBe(5);
    expect(r.hasMore).toBe(false);
  });

  it('busca por nome (parcial, case-insensitive)', () => {
    const r = filterAndPaginate(seed, 'silva', keys, 1, 10);
    expect(r.filtered).toHaveLength(1);
    expect(r.filtered[0].name).toBe('Ana Silva');
  });

  it('busca por email substring', () => {
    const r = filterAndPaginate(seed, '@x.com', keys, 1, 10);
    // Ana, Carla, Eduarda têm @x.com
    expect(r.filtered).toHaveLength(3);
  });

  it('busca sem resultados', () => {
    const r = filterAndPaginate(seed, 'xyz', keys, 1, 10);
    expect(r.filtered).toHaveLength(0);
    expect(r.hasMore).toBe(false);
  });

  it('busca com espaços extras é trimada', () => {
    const r = filterAndPaginate(seed, '   silva   ', keys, 1, 10);
    expect(r.filtered).toHaveLength(1);
  });
});
