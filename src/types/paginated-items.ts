export interface PaginatedItems<T> {
	paging: Record<string, never>;
	data: Array<T>;
}
