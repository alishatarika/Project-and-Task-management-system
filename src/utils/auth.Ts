export const AUTH_CHANGE_EVENT = "auth:change";

const TOKEN_KEY = "access_token";
const USER_KEY = "user";


function setCookie(name: string, value: string, days = 1): void {
  const maxAge = days * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

function getCookie(name: string): string | null {
  const key = encodeURIComponent(name) + "=";
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(key)) {
      return decodeURIComponent(trimmed.slice(key.length));
    }
  }
  return null;
}

function deleteCookie(name: string): void {
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
}


export function setToken(token: string, rememberMe = false): void {
  setCookie(TOKEN_KEY, token, rememberMe ? 7 : 1);
}

export function getToken(): string | null {
  return getCookie(TOKEN_KEY);
}

export function removeToken(): void {
  deleteCookie(TOKEN_KEY);
}


export function setUser(user: object, rememberMe = false): void {
  setCookie(USER_KEY, JSON.stringify(user), rememberMe ? 7 : 1);
}

export function getUser<T = unknown>(): T | null {
  const raw = getCookie(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function removeUser(): void {
  deleteCookie(USER_KEY);
}

export function saveAuth(token: string, user: object, rememberMe = false): void {
  setToken(token, rememberMe);
  setUser(user, rememberMe);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function clearAuth(): void {
  removeToken();
  removeUser();
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function isLoggedIn(): boolean {
  return getToken() !== null && getUser() !== null;
}

export const checkAuth = isLoggedIn;

export function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
} 