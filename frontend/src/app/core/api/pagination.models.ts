export interface ApiResource<TData> {
  data: TData;
}

export interface ApiPageLink {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}

export interface ApiPageMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links: readonly ApiPageLink[];
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface ApiPage<TData> {
  data: readonly TData[];
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta?: ApiPageMeta;
}
