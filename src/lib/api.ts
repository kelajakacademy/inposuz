export function getServerUrl(): string {
  try {
    const saved = localStorage.getItem("pos_server_url");
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, "");
    }
  } catch (e) {}
  return "";
}

export function setServerUrl(url: string): void {
  try {
    const clean = url.trim().replace(/\/+$/, "");
    if (!clean) {
      localStorage.removeItem("pos_server_url");
    } else {
      localStorage.setItem("pos_server_url", clean);
    }
  } catch (e) {}
}

export function apiUrl(endpoint: string): string {
  const base = getServerUrl();
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return base ? `${base}${path}` : path;
}

export async function apiFetch(endpoint: string, init?: RequestInit): Promise<Response> {
  const url = apiUrl(endpoint);
  return fetch(url, init);
}

export async function testServerConnection(url: string): Promise<{ success: boolean; message: string }> {
  try {
    const clean = url.trim().replace(/\/+$/, "");
    const target = clean ? `${clean}/api/health` : "/api/health";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    const res = await fetch(target, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      return { success: true, message: "Серверга муваффақиятли уланди (Status: OK)!" };
    }
    return { success: false, message: `Сервер жавоби: HTTP ${res.status}` };
  } catch (e: any) {
    if (e.name === "AbortError") {
      return { success: false, message: "Сервер жавоб бериш вақти тугади (Timeout)" };
    }
    return { success: false, message: "Уланишда хатолик: " + (e.message || "Сервер манзили текширилсин") };
  }
}
