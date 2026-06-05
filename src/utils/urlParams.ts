
import { Filters } from '@/types/check';

export interface ChecksURLParams {
  view?: 'list' | 'grid';
  live?: boolean;
  size?: number;
  status?: string;
  url?: string;
  operator?: string;
  location?: string;
  statusCode?: string;
  node?: string;
  filters?: boolean;
  page?: number;
}

export const parseURLParams = (searchParams: URLSearchParams): ChecksURLParams => {
  const params: ChecksURLParams = {};
  
  const view = searchParams.get('view');
  if (view === 'list' || view === 'grid') {
    params.view = view;
  }
  
  const live = searchParams.get('live');
  if (live === 'true' || live === 'false') {
    params.live = live === 'true';
  }
  
  const size = searchParams.get('size');
  if (size) {
    const sizeNum = parseInt(size, 10);
    if (sizeNum >= 2 && sizeNum <= 12) {
      params.size = sizeNum;
    }
  }
  
  const status = searchParams.get('status');
  if (status && ['all', 'success', 'failed', 'warning', 'running'].includes(status)) {
    params.status = status;
  }
  
  const url = searchParams.get('url');
  if (url) {
    params.url = decodeURIComponent(url);
  }
  
  const operator = searchParams.get('operator');
  if (operator) {
    params.operator = decodeURIComponent(operator);
  }
  
  const location = searchParams.get('location');
  if (location) {
    params.location = decodeURIComponent(location);
  }
  
  const statusCode = searchParams.get('statusCode');
  if (statusCode) {
    params.statusCode = statusCode;
  }
  
  const node = searchParams.get('node');
  if (node) {
    params.node = decodeURIComponent(node);
  }
  
  const filtersParam = searchParams.get('filters');
  if (filtersParam === 'true' || filtersParam === 'false') {
    params.filters = filtersParam === 'true';
  }
  
  const page = searchParams.get('page');
  if (page) {
    const pageNum = parseInt(page, 10);
    if (pageNum > 0) {
      params.page = pageNum;
    }
  }
  
  return params;
};

export const generateURLParams = (state: {
  viewMode: 'list' | 'grid';
  isLivePlaying: boolean;
  gridColumns: number;
  filters: Filters;
  showFilters: boolean;
  currentPage: number;
}): string => {
  const params = new URLSearchParams();
  
  if (state.viewMode !== 'grid') {
    params.set('view', state.viewMode);
  }
  
  if (state.isLivePlaying) {
    params.set('live', 'true');
  }
  
  if (state.viewMode === 'grid' && state.gridColumns !== 6) {
    params.set('size', state.gridColumns.toString());
  }
  
  if (state.filters.status !== 'all') {
    params.set('status', state.filters.status);
  }
  
  if (state.filters.url) {
    params.set('url', encodeURIComponent(state.filters.url));
  }
  
  if (state.filters.operator) {
    params.set('operator', encodeURIComponent(state.filters.operator));
  }
  
  if (state.filters.location !== 'all') {
    params.set('location', encodeURIComponent(state.filters.location));
  }
  
  if (state.filters.statusCode !== 'all') {
    params.set('statusCode', state.filters.statusCode);
  }
  
  if (state.filters.node) {
    params.set('node', encodeURIComponent(state.filters.node));
  }
  
  if (state.showFilters) {
    params.set('filters', 'true');
  }
  
  if (state.currentPage > 1) {
    params.set('page', state.currentPage.toString());
  }
  
  return params.toString();
};
