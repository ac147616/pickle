import { getDevHost } from './dev-host';
import { auth } from './firebase';

const API_BASE_URL = `http://${getDevHost()}:3000`;

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new ApiError('AUTH_NOT_SIGNED_IN', 'Not signed in', 401);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const errorBody = body as { code?: string; message?: string } | null;
    throw new ApiError(
      errorBody?.code ?? 'UNKNOWN_ERROR',
      errorBody?.message ?? 'Request failed',
      response.status,
    );
  }

  return body as T;
}
