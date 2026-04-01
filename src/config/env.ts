const apiBaseUrl = import.meta.env.API_BASE_URL;

if (!apiBaseUrl || apiBaseUrl.trim().length === 0) {
  throw new Error("Missing API_BASE_URL in environment configuration.");
}

export const API_BASE_URL = apiBaseUrl;
