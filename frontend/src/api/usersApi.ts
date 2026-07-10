import API from './index';

// matches backend UserProfileResponse in user-service microservice
export type UserProfileResponse = {
  id: string;
  displayName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
};

// matches backend UserProfileRequest in user-service microservice
export type UserProfileRequest = {
  displayName: string;
  email: string;
  password: string;
  role: string;
  avatarUrl?: string;
  bio?: string;
};

export async function getCurrentUser() {
  const response = await API.get<UserProfileResponse>('/api/users/me');
  return response.data;
}

export async function createUser(body: UserProfileRequest) {
  const response = await API.post<UserProfileResponse>('/api/users/register', body);
  return response.data;
}

export async function updateCurrentUser(body: UserProfileRequest) {
  const response = await API.put<UserProfileResponse>('/api/users/me', body);
  return response.data;
}

export async function deleteCurrentUser() {
  await API.delete('/api/users/me');
}
