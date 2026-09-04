/**
 * SENTINEL-X Backend API Client
 * Connects the SPECTER-TRACE and SENTINEL-X frontend to FastAPI (port 8000).
 */
import { getBackendUrl, getWsUrl } from "../config/api";

export { getBackendUrl, getWsUrl };
export const API_BASE = getBackendUrl();
export const WS_BASE = getWsUrl();

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("sentinel_token", token);
      localStorage.setItem("sentinelx_token", token);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("sentinel_token");
      localStorage.removeItem("sentinelx_token");
    }
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== "undefined") {
    authToken =
      localStorage.getItem("token") ||
      localStorage.getItem("sentinel_token") ||
      localStorage.getItem("sentinelx_token");
  }
  return authToken;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const activeBase = getBackendUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${activeBase}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginResult {
  access_token: string;
  role: string;
  user: string;
}

export function login(username: string, password: string) {
  return request<LoginResult>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

// ── Graph (Module E) ─────────────────────────────────────────────────────────
export interface GraphNode {
  data: Record<string, unknown>;
}
export interface GraphEdge {
  data: Record<string, unknown>;
}
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
export interface Neighbor {
  node: string;
  label: string;
  type: string;
  relation: string;
  confidence: number;
  direction: string;
}
export interface PathResult {
  path: string[];
  nodes?: { id: string; label: string; type: string }[];
  edges?: { source: string; target: string; label: string }[];
  length?: number;
}
export interface CentralityItem {
  id: string;
  label: string;
  type: string;
  betweenness: number;
}

export async function getGraph(caseId: string = "1") {
  try {
    return await request<GraphData>(`/api/graph/${caseId}/cytoscape`);
  } catch {
    return request<GraphData>("/api/graph");
  }
}

export function getNeighbors(nodeId: string) {
  return request<{ node: string; neighbors: Neighbor[] }>(
    `/api/graph/neighbors/${encodeURIComponent(nodeId)}`
  );
}

export function getShortestPath(src?: string, dst?: string, caseId: string = "1") {
  const params = new URLSearchParams();
  if (src) params.set("from", src);
  if (dst) params.set("to", dst);
  const q = params.toString() ? `?${params.toString()}` : "";
  return request<PathResult>(`/api/graph/${caseId}/shortest-path${q}`);
}

export function getCentrality(caseId: string = "1") {
  return request<any>(`/api/graph/${caseId}/centrality`);
}

// ── Audit (Module F) ─────────────────────────────────────────────────────────
export interface AuditEntry {
  id?: number;
  seq: number;
  actor: string;
  action: string;
  entity_ids: string[];
  detail: string;
  timestamp: string;
  prev_hash: string;
  entry_hash: string;
}

export interface AuditVerify {
  valid: boolean;
  entries: number;
  chain_tip_hash: string;
}

export async function getAuditLog(caseId: string = "1") {
  try {
    return await request<AuditEntry[]>(`/api/workbench/audit/${caseId}`);
  } catch {
    return request<AuditEntry[]>("/api/audit");
  }
}

export async function verifyAuditChain(caseId: string = "1") {
  try {
    return await request<AuditVerify>(`/api/workbench/audit/${caseId}/verify`);
  } catch {
    return request<AuditVerify>("/api/audit/verify");
  }
}

// ── Cases & Dossier PDF ──────────────────────────────────────────────────────
export async function downloadPdfDossier(caseId: string = "1", filename?: string) {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const activeBase = getBackendUrl();
  const res = await fetch(`${activeBase}/api/cases/${caseId}/dossier/pdf`, {
    headers,
  });
  if (!res.ok) {
    throw new Error(`Failed to download dossier: HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `SENTINEL-X_NTRO_DOSSIER_CASE_${caseId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
