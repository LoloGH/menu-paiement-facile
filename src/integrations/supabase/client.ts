
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = 'https://kqukhginnbwuqrejhlsp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdWtoZ2lubmJ3dXFyZWpobHNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkxMjYxNzcsImV4cCI6MjAyNDcwMjE3N30.vBu1yfCWwZimvYB4JKfs4Jdi9UG_IlJh9d2qktEnYVY';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export type AdminRoleType = 'admin' | 'user' | 'order_manager' | 'viewer';

export const isAdminUser = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();

  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }

  return !!data;
};

export const hasUserRole = async (userId: string, role: AdminRoleType): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', role)
    .single();

  if (error) {
    console.error('Error checking role:', error);
    return false;
  }

  return !!data;
};

export const logAdminAction = async (
  userId: string,
  action: string,
  resource: string,
  details?: any
): Promise<void> => {
  try {
    await supabase.from('admin_audit_log').insert({
      user_id: userId,
      action,
      resource,
      details
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};
