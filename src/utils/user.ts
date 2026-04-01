export function getUserInitials(name: string, email: string): string {
  const source = name.trim() || email.split("@")[0]?.trim() || "user";
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
  }

  const first = words[0] ?? "user";
  return `${first[0] ?? ""}${first[1] ?? first[0] ?? ""}`.toUpperCase();
}
