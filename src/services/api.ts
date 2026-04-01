import type { LoginPayload, RegisterPayload, Role, UserListItem, VideoFilters, VideoItem } from "../types";
import { API_BASE_URL } from "../config/env";

type ApiError = {
  message?: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = (await response.json()) as T | ApiError;

  if (!response.ok) {
    throw new Error((data as ApiError).message ?? "Request failed");
  }

  return data as T;
}

export function loginRequest(payload: LoginPayload) {
  return request<{ token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerRequest(payload: RegisterPayload) {
  return request<{ message: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function buildVideoQuery(filters: VideoFilters = {}) {
  const params = new URLSearchParams();

  if (filters.status) params.set("status", filters.status);
  if (filters.sensitivity) params.set("sensitivity", filters.sensitivity);
  if (filters.search && filters.search.trim().length > 0) params.set("search", filters.search.trim());
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.all) params.set("all", "true");

  const qs = params.toString();
  return qs.length > 0 ? `?${qs}` : "";
}

export function getVideos(token: string, filters: VideoFilters = {}) {
  return request<{ videos: VideoItem[] }>(`/api/video${buildVideoQuery(filters)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getUsers(token: string) {
  return request<{ users: UserListItem[] }>("/api/user", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateUserRole(token: string, payload: { userId: string; role: Role }) {
  return request<{ message: string; user: UserListItem }>("/api/user/role", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function uploadVideo(token: string, payload: { title: string; file: File }) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("video", payload.file);

  const response = await fetch(`${API_BASE_URL}/api/video/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = (await response.json()) as { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "Upload failed");
  }

  return data;
}

export function getStreamUrl(videoId: string, token: string) {
  const encodedToken = encodeURIComponent(token);
  return `${API_BASE_URL}/api/video/stream/${videoId}?token=${encodedToken}`;
}
