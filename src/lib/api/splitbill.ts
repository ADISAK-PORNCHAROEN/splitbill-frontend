export interface Group {
  id: number;
  name: string;
}

export interface GroupDetail extends Group {
  members: string[];
}

export interface Expense {
  id: number;
  group_id: number;
  description: string;
  paid_by: string;
  amount: string;
  shares: Record<string, string>;
  created_at: string;
}

export interface Balance {
  member: string;
  balance: string;
}

export interface CreateExpense {
  description: string;
  paid_by: string;
  amount: string;
  split:
    | { type: "equal"; members: string[] }
    | { type: "exact"; shares: Record<string, string> };
}

export class ApiError extends Error {
  constructor(
    public readonly kind: "http" | "network" | "contract",
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMoney(value: unknown): value is string {
  return typeof value === "string" && /^-?\d+(?:\.\d{1,2})?$/.test(value);
}

function isGroup(value: unknown): value is Group {
  return isRecord(value) && Number.isInteger(value.id) && typeof value.name === "string";
}

function isGroupDetail(value: unknown): value is GroupDetail {
  return isGroup(value) && "members" in value && Array.isArray(value.members) && value.members.every((member) => typeof member === "string");
}

function isExpense(value: unknown): value is Expense {
  return isRecord(value) && Number.isInteger(value.id) && Number.isInteger(value.group_id)
    && typeof value.description === "string" && typeof value.paid_by === "string"
    && isMoney(value.amount) && isRecord(value.shares) && Object.values(value.shares).every(isMoney)
    && typeof value.created_at === "string";
}

function isBalance(value: unknown): value is Balance {
  return isRecord(value) && typeof value.member === "string" && isMoney(value.balance);
}

function arrayOf<T>(guard: (value: unknown) => value is T) {
  return (value: unknown): value is T[] => Array.isArray(value) && value.every(guard);
}

function httpErrorMessage(status: number): string {
  if (status === 400) return "Please check your details and try again.";
  if (status === 403) return "You are not allowed to perform this action.";
  if (status === 404) return "This group or expense is unavailable.";
  return "Something went wrong. Please try again.";
}

export class SplitbillApi {
  private readonly baseUrl: string;

  constructor(baseUrl: string | undefined) {
    const configuredBaseUrl = baseUrl?.trim();
    if (!configuredBaseUrl) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is required. Copy .env.example to .env.local and set the backend API origin.");
    }

    let apiUrl: URL;
    try {
      apiUrl = new URL(configuredBaseUrl);
    } catch {
      throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) origin without credentials, path, query, or fragment.");
    }

    if ((apiUrl.protocol !== "http:" && apiUrl.protocol !== "https:")
      || apiUrl.username || apiUrl.password || apiUrl.pathname !== "/" || apiUrl.search || apiUrl.hash) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) origin without credentials, path, query, or fragment.");
    }

    this.baseUrl = apiUrl.origin;
  }

  private async request<T>(
    path: string,
    user: string,
    guard: (value: unknown) => value is T,
    options: { method?: "GET" | "POST"; body?: CreateExpense; key?: string; signal?: AbortSignal } = {},
  ): Promise<T> {
    const response = await this.send(path, user, options);
    let data: unknown;
    try {
      data = await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      throw new ApiError("contract", "The server returned an invalid response.", response.status);
    }
    if (!guard(data)) throw new ApiError("contract", "The server returned an unexpected response.", response.status);
    return data;
  }

  private async send(
    path: string,
    user: string,
    options: { method?: "GET" | "POST" | "DELETE"; body?: CreateExpense; key?: string; signal?: AbortSignal } = {},
  ): Promise<Response> {
    const headers: Record<string, string> = { "X-User": user };
    if (options.body) headers["Content-Type"] = "application/json";
    if (options.key) headers["Idempotency-Key"] = options.key;
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: options.method ?? "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      throw new ApiError("network", "Unable to connect. Please check your connection and try again.");
    }
    if (!response.ok) {
      let data: unknown;
      try { data = await response.json(); } catch { data = null; }
      const details = isRecord(data) && isRecord(data.error) ? data.error : null;
      const message = details && typeof details.message === "string" && details.message.trim()
        ? details.message : httpErrorMessage(response.status);
      const code = details && typeof details.code === "string" ? details.code : undefined;
      throw new ApiError("http", message, response.status, code);
    }
    return response;
  }

  groups(user: string, signal?: AbortSignal): Promise<Group[]> {
    return this.request("/groups", user, arrayOf(isGroup), { signal });
  }

  group(user: string, groupId: number, signal?: AbortSignal): Promise<GroupDetail> {
    return this.request(`/groups/${groupId}`, user, isGroupDetail, { signal });
  }

  expenses(user: string, groupId: number, signal?: AbortSignal): Promise<Expense[]> {
    return this.request(`/groups/${groupId}/expenses`, user, arrayOf(isExpense), { signal });
  }

  balances(user: string, groupId: number, signal?: AbortSignal): Promise<Balance[]> {
    return this.request(`/groups/${groupId}/balances`, user, arrayOf(isBalance), { signal });
  }

  createExpense(user: string, groupId: number, body: CreateExpense, key: string): Promise<Expense> {
    return this.request(`/groups/${groupId}/expenses`, user, isExpense, { method: "POST", body, key });
  }

  async deleteExpense(user: string, groupId: number, expenseId: number): Promise<void> {
    const response = await this.send(`/groups/${groupId}/expenses/${expenseId}`, user, { method: "DELETE" });
    if (response.status !== 204) throw new ApiError("contract", "The server returned an unexpected deletion response.", response.status);
  }
}
