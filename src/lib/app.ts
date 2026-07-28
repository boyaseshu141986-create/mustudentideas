export const STUDENT_DOMAIN = "marwadiuniversity.ac.in";
export const MENTOR_DOMAIN = "marwadieducation.edu.in";

export const ADMIN_USERNAME = "Marwadi";
export const ADMIN_PASSWORD = "2026";
export const ADMIN_EMAIL = "admin@marwadiuniversity.ac.in";

export type Role = "student" | "mentor" | "ngo" | "admin";

export const HOME_FOR_ROLE: Record<Role, string> = {
  student: "/student",
  mentor: "/mentor",
  ngo: "/ngo",
  admin: "/admin",
};

export function domainForRole(role: Role) {
  return role === "student" ? STUDENT_DOMAIN : MENTOR_DOMAIN;
}

export function emailMatchesRole(email: string, role: Role) {
  const value = email.trim().toLowerCase();
  if (role === "student") return value.endsWith(`@${STUDENT_DOMAIN}`);
  if (role === "mentor") return value.endsWith(`@${MENTOR_DOMAIN}`);
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

export const COMMUNITY_ROOM = "community";
export const helpRoom = (studentId: string, mentorId: string) => `help-${studentId}-${mentorId}`;
export const ngoRoom = (ngoId: string) => `ngo-${ngoId}`;
export const adminRoom = (userId: string) => `admin-${userId}`;

export function youtubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return match ? match[1] : null;
}
