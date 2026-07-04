import { useConfig } from "../context/ConfigContext";
import { getAccessToken, clearAuthSession } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import type {
  ListSpecsResponse,
  GetSpecResponse,
  ListVersionsResponse,
  GetVersionResponse,
  GetCompatReportResponse,
  CompareVersionsResponse,
} from "core";

export type SpecFilters = {
  type?: string;
  owner?: string;
  tags?: string[];
};

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

const POST_LOGIN_PATH_KEY = "grapity_post_login_path";

function handleUnauthorized(navigate: ReturnType<typeof useNavigate>): never {
  clearAuthSession();
  const path = window.location.pathname + window.location.search;
  if (path !== "/" && !path.startsWith("/callback")) {
    localStorage.setItem(POST_LOGIN_PATH_KEY, path);
  }
  navigate("/", { replace: true });
  throw new Error("Session expired. Sign in again.");
}

export function useApiClient() {
  const { registryUrl, auth } = useConfig();
  const navigate = useNavigate();

  async function request<T>(method: string, path: string): Promise<T> {
    const url = `${registryUrl}${path}`;
    const headers: Record<string, string> = {};
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, { method, headers });

    if (response.status === 401 && auth) {
      handleUnauthorized(navigate);
    }

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as Partial<ApiError>;
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async function requestText(method: string, path: string): Promise<string> {
    const url = `${registryUrl}${path}`;
    const headers: Record<string, string> = {};
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, { method, headers });

    if (response.status === 401 && auth) {
      handleUnauthorized(navigate);
    }

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as Partial<ApiError>;
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }

    return response.text();
  }

  return {
    listSpecs: async (filters?: SpecFilters) => {
      const params = new URLSearchParams();
      if (filters?.type) params.set("type", filters.type);
      if (filters?.owner) params.set("owner", filters.owner);
      if (filters?.tags?.length) params.set("tags", filters.tags.join(","));
      const query = params.toString();
      const res = await request<ListSpecsResponse>("GET", `/v1/specs${query ? `?${query}` : ""}`);
      return res.data;
    },

    getSpec: async (name: string) => {
      const res = await request<GetSpecResponse>("GET", `/v1/specs/${name}`);
      return res.data;
    },

    listVersions: async (name: string) => {
      const res = await request<ListVersionsResponse>("GET", `/v1/specs/${name}/versions`);
      return res;
    },

    getVersion: async (name: string, semver: string) => {
      const res = await request<GetVersionResponse>("GET", `/v1/specs/${name}/versions/${semver}`);
      return res.data;
    },

    getCompatReport: async (name: string, semver: string) => {
      const res = await request<GetCompatReportResponse>("GET", `/v1/specs/${name}/compat/${semver}`);
      return res.data;
    },

    compareVersions: async (name: string, from: string, to: string) => {
      const res = await request<CompareVersionsResponse>("GET", `/v1/specs/${name}/compare?from=${from}&to=${to}`);
      return res.data;
    },

    getSpecContent: async (name: string, semver: string, format: "json" | "yaml") => {
      return requestText("GET", `/v1/specs/${name}/versions/${semver}/spec.${format}`);
    },
  };
}
