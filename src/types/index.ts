export type Role = "ADMIN" | "EDITOR" | "VIEWER";

export type UserInfo = {
  id: string;
  email: string;
  role: Role;
};

export type UserListItem = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
};

export type TokenPayload = {
  userId: string;
  email?: string;
  role: Role;
  iat: number;
  exp: number;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type VideoItem = {
  _id: string;
  title: string;
  filename: string;
  status: "UPLOADING" | "PROCESSING" | "COMPLETED";
  sensitivity?: "SAFE" | "FLAGGED";
  user?: string | { _id: string };
  createdAt?: string;
};

export type VideoFilters = {
  status?: "UPLOADING" | "PROCESSING" | "COMPLETED" | "";
  sensitivity?: "SAFE" | "FLAGGED" | "";
  search?: string;
  sort?: "asc" | "desc";
  all?: boolean;
};

export type VideoProgressEvent = {
  videoId: string;
  status: "UPLOADING" | "PROCESSING" | "COMPLETED";
  progress: number;
  sensitivity: "SAFE" | "FLAGGED" | null;
  updatedAt: string;
};

export type AdminUserCreatedEvent = {
  user: UserListItem;
  createdAt: string;
};

export type AdminVideoUploadedEvent = {
  videoId: string;
  userId: string;
  createdAt: string;
};

export type AuthContextType = {
  token: string | null;
  user: UserInfo | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
};
