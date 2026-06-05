export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
}

const USERS_KEY = "offside_users";
const CURRENT_USER_KEY = "offside_current_user_email";

export function getStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getCurrentUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const email = localStorage.getItem(CURRENT_USER_KEY);
  if (!email) return null;
  return getStoredUsers().find(user => user.email === email) || null;
}

export function signUpUser(name: string, email: string, password: string): StoredUser {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getStoredUsers();

  if (users.some(user => user.email === normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    password,
  };

  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  localStorage.setItem(CURRENT_USER_KEY, user.email);
  return user;
}

export function loginUser(email: string, password: string): StoredUser {
  const normalizedEmail = email.trim().toLowerCase();
  const user = getStoredUsers().find(item => (
    item.email === normalizedEmail &&
    item.password === password
  ));

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  localStorage.setItem(CURRENT_USER_KEY, user.email);
  return user;
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getFavoriteTeamsKey() {
  const user = getCurrentUser();
  return user ? `followed_teams:${user.email}` : "followed_teams:guest";
}
