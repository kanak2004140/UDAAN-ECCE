import api from "@/lib/api/client";

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  date_of_birth?: string;
  role?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  date_of_birth: string | null;
  age: number | null;
  age_group: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export async function registerUser(payload: UserCreate): Promise<AuthResponse> {
  return api.post<AuthResponse>("/users/register", payload);
}

export async function loginUser(payload: UserLogin): Promise<AuthResponse> {
  return api.post<AuthResponse>("/users/login", payload);
}

/** The signed-in user, checked against the database. */
export async function getMe(): Promise<UserResponse> {
  return api.get<UserResponse>("/users/me");
}

export async function getUser(userId: string): Promise<UserResponse> {
  return api.get<UserResponse>(`/users/${userId}`);
}
