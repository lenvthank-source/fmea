export interface PaginatedPayload<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export function unwrapPaginated<T>(payload: any): PaginatedPayload<T> {
  if (Array.isArray(payload)) {
    return { data: payload, total: payload.length, page: 1, limit: payload.length || 0 };
  }
  if (payload && Array.isArray(payload.data)) {
    return {
      data: payload.data,
      total: typeof payload.total === 'number' ? payload.total : payload.data.length,
      page: typeof payload.page === 'number' ? payload.page : 1,
      limit: typeof payload.limit === 'number' ? payload.limit : payload.data.length,
    };
  }
  // fallback for alternative keys
  const altData = payload?.rows ?? payload?.items ?? payload?.projects ?? [];
  if (Array.isArray(altData)) {
    return { data: altData, total: payload?.total ?? altData.length, page: payload?.page ?? 1, limit: payload?.limit ?? altData.length };
  }
  return { data: [], total: 0, page: 1, limit: 0 };
}
