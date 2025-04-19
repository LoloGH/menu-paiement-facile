
/**
 * Represents an audit log entry for administrative actions
 */
export interface AdminAuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  details: string | null;
  created_at: string;
  user_email?: string;
}
