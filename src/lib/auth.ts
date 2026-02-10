import { createClient } from './neon';

export interface Admin {
  id: string;
  username: string;
  password: string; // In production, this should be hashed
  created_at: string;
  updated_at: string;
}

// Simple admin authentication
export async function authenticateAdmin(username: string, password: string): Promise<Admin | null> {
  try {
    // For demo mode - hardcoded admin credentials
    if (process.env.NODE_ENV === 'development' || !process.env.NEON_DATABASE_URL) {
      if (username === 'admin' && password === 'admin123') {
        return {
          id: '1',
          username: 'admin',
          password: 'admin123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return null;
    }

    // Production mode - check database
    const sql = createClient();
    const result = await sql`
      SELECT * FROM admins 
      WHERE username = ${username} AND password = ${password}
      LIMIT 1
    `;

    if (result.length > 0) {
      return result[0] as Admin;
    }
    
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('admin_authenticated') === 'true';
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

export function setAuthenticated(admin: Admin): void {
  if (typeof window === 'undefined') return;
  
  // Set localStorage for client-side
  localStorage.setItem('admin_authenticated', 'true');
  localStorage.setItem('admin_username', admin.username);
  localStorage.setItem('admin_id', admin.id);
  
  // Set cookie for server-side middleware
  document.cookie = 'admin_authenticated=true; path=/; max-age=86400'; // 24 hours
}

export function clearAuthentication(): void {
  if (typeof window === 'undefined') return;
  
  // Clear localStorage
  localStorage.removeItem('admin_authenticated');
  localStorage.removeItem('admin_username');
  localStorage.removeItem('admin_id');
  
  // Clear cookie
  document.cookie = 'admin_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
}

export function getAdminInfo(): { username: string; id: string } | null {
  if (typeof window === 'undefined') return null;
  const username = localStorage.getItem('admin_username');
  const id = localStorage.getItem('admin_id');
  
  if (username && id) {
    return { username, id };
  }
  
  return null;
}