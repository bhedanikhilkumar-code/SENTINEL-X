/**
 * SENTINEL-X Backend API Client
 * Connects the SPECTER-TRACE frontend to the FastAPI backend (port 8100).
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8100";
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem("sentinelx_token", token);
    else localStorage.removeItem("sentinelx_token");
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== "undefined") {
    authToken = localStorage.getItem("sentinelx_token");
  }
  return authToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginResult { access_token: string; role: string; user: string; }
export function login(username: string, password: string) {
  return request<LoginResult>("/api/auth/login", {
    method: "POST", body: JSON.stringify({ username, password }),
  });
}

// ── Graph (Module E) ─────────────────────────────────────────────────────────
export interface GraphNode { data: Record<string, unknown>; }
export interface GraphEdge { data: Record<string, unknown>; }
export interface GraphData { nodes: GraphNode[]; edges: GraphEdge[]; }
export interface Neighbor { node: string; label: string; type: string; relation: string; confidence: number; direction: string; }
export interface PathResult { path: string[]; nodes: { id: string; label: string; type: string }[]; }
export interface Community { size: number; nodes: { id: string; type: string; label: string }[]; }
export interface TimelineStage { stage: number; at: string; label: string; node_count: number; nodes: string[]; }
export interface CentralityItem { id: string; label: string; type: string; betweenness: number; }

export function getGraph() { return request<GraphData>("/api/graph"); }
export function getNeighbors(nodeId: string) {
  return request<{ node: string; neighbors: Neighbor[] }>(`/api/graph/neighbors/${encodeURIComponent(nodeId)}`);
}

// ── Audit (Module F) ─────────────────────────────────────────────────────────
export interface AuditEntry {
  id: number; seq: number; actor: string; action: string;
  entity_ids: string[]; detail: string; timestamp: string;
  prev_hash: string; entry_hash: string;
}
export interface AuditVerify { valid: boolean; entries: number; chain_tip_hash: string; }
export function getAuditLog() { return request<AuditEntry[]>("/api/audit/log"); }
export function verifyAuditChain() { return request<AuditVerify>("/api/audit/verify"); }

// ── Stylometry (Module C) ────────────────────────────────────────────────────
export interface StylometryFeatures {
  doc_id: string; author: string; source_type: string;
  features: Record<string, number>;
  multi_author_assessment: { is_multi_author: boolean; reason: string };
  translation_assessment: { is_translated: boolean; reason: string };
  timezone_ranking: { timezone: string; score: number }[];
  hourly_distribution: { hour: number; count: number }[];
}
export function getStylometry(docId: string) {
  return request<StylometryFeatures>(`/api/stylometry/${docId}`);
}

// ── Correlation (Module D) ───────────────────────────────────────────────────
export interface CorrelationResult {
  query: string; matched_identities: Record<string, unknown>[];
  signals_evaluated: number;
  correlation_result: { c_total: number; breakdown: { signal_type: string; ci: number; wi: number; contribution: number; detail: Record<string, unknown>; }[]; };
}
export function searchCorrelation(query: string) {
  return request<CorrelationResult>("/api/correlation/search", {
    method: "POST", body: JSON.stringify({ query }),
  });
}

// ── Cases ────────────────────────────────────────────────────────────────────
export interface CaseItem { id: string; title: string; status: string; assigned_to: string; confidence_trend: number; hypothesis_count: number; created_at: string; }
export function getCases() { return request<CaseItem[]>("/api/cases"); }
export function getCase(caseId: string) { return request<CaseItem>(`/api/cases/${caseId}`); }

// ── Ingestion ────────────────────────────────────────────────────────────────
export interface DocumentItem { id: string; source_url: string; source_type: string; author_handle: string; platform: string; sha256: string; collected_at: string; posted_at: string; }
export function getDocuments() { return request<DocumentItem[]>("/api/ingest/documents"); }
export interface CollectorStatus { tor_socks_up: boolean; tor_control_up: boolean; egress_policy: string; scrubbed_headers: string[]; captcha_handling: string; }
export function getCollectorStatus() { return request<CollectorStatus>("/api/ingest/collector/status"); }

// ── Health ───────────────────────────────────────────────────────────────────
export function healthCheck() { return request<{ status: string; version: string }>("/api/health"); }

export function getShortestPath(src: string, dst: string) {
  return request<PathResult>(`/api/graph/path?src=${encodeURIComponent(src)}&dst=${encodeURIComponent(dst)}`);
}
export function getCentrality() { return request<CentralityItem[]>("/api/graph/centrality"); }
export function getCommunities() { return request<{ communities: Community[] }>("/api/graph/communities"); }
export function getTimeline() {
  return request<{ total_nodes: number; total_edges: number; stages: TimelineStage[] }>("/api/graph/timeline");
}
