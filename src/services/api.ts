import type { LoginPayload, RegisterPayload, Role, UserListItem, VideoFilters, VideoItem } from "../types";
import { API_BASE_URL } from "../config/env";
import { ApiRequestError, getApiErrorMessage } from "../utils/error";

type ApiError = {
  message?: string;
  error?: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => null)) as T | ApiError | null;

  if (!response.ok) {
    const serverMessage = (data as ApiError | null)?.message ?? (data as ApiError | null)?.error;
    throw new ApiRequestError(getApiErrorMessage(response.status, serverMessage), response.status, serverMessage);
  }

  return (data ?? {}) as T;
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

export function getProfile(token: string) {
  return request<{ user: UserListItem }>("/api/user/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateProfile(token: string, payload: { name: string; email: string }) {
  return request<{ message: string; user: UserListItem }>("/api/user/profile", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function updatePassword(token: string, payload: { currentPassword: string; newPassword: string }) {
  return request<{ message: string }>("/api/user/password", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function uploadVideo(
  token: string,
  payload: { title: string; file: File },
  onProgress?: (percent: number) => void
) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("video", payload.file);

  return new Promise<{ message?: string; error?: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", `${API_BASE_URL}/api/video/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }

      const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
      onProgress(percent);
    };

    xhr.onload = () => {
      const responseText = xhr.responseText;
      let data: { message?: string; error?: string } = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText) as { message?: string; error?: string };
        } catch {
          data = {};
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data ?? {});
        return;
      }

      const serverMessage = data?.message ?? data?.error;
      reject(new ApiRequestError(getApiErrorMessage(xhr.status, serverMessage), xhr.status, serverMessage));
    };

    xhr.onerror = () => {
      reject(new ApiRequestError("Network error. Please check your connection and try again.", 0));
    };

    xhr.onabort = () => {
      reject(new ApiRequestError("Upload was cancelled.", 0));
    };

    xhr.send(formData);
  });
}

export function getStreamUrl(videoId: string, token: string) {
  const encodedToken = encodeURIComponent(token);
  return `${API_BASE_URL}/api/video/stream/${videoId}?token=${encodedToken}`;
}
