export interface JwtPayload {
  publicHandle?: string | null;
  sub: string;        // User ID
  email: string;      // User Email
  tenantId: string;   // Tenant ID
  roles: string[];    // User Roles
  permissions: string[]; // User Permissions
  isGuest?: boolean;  // Is Guest User
}
