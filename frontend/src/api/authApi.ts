import API from './index';

export type AuthUser = {
  authUserId: string | null;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

// matches backend AuthStatusResponse in user-service microservice
export type AuthStatusResponse = AuthUser & {
  authenticated: boolean;
};

export interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthStatus: () => Promise<void>;
}

export async function getAuthStatus() {
  const response = await API.get<AuthStatusResponse>('/api/auth/status');
  return response.data;
}

export async function submitAuthCredentials(email: string, password: string) {
  const body = new URLSearchParams();
  body.append('j_username', email);
  body.append('j_password', password);

  await API.post('/api/j_security_check', body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
}

export async function logout() {
  await API.post('/api/auth/logout');
}
