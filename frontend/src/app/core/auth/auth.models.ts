export interface AuthUser {
  id: number;
  name: string;
  email: string;
  department_id: number | null;
  roles: readonly string[];
  permissions: readonly string[];
}

export interface LoginResponse {
  token_type: 'Bearer';
  token: string;
  user: AuthUser;
}

export interface UserResponse {
  data: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
