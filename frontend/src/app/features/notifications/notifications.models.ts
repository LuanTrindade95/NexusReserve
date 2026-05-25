export interface AppNotification {
  id: string;
  type: string;
  data: {
    title?: string;
    message?: string;
    reservation_id?: number;
    resource_id?: number;
    resource_name?: string | null;
    status?: string;
    note?: string | null;
  };
  read_at: string | null;
  created_at: string;
}
