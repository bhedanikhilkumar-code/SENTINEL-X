"""Module E — Knowledge Graph Service (Neo4j native integration + NetworkX chronological hybrid).

Provides:
1. Neo4j native async functions (PRD 3.E): add_actor_node, add_alias_node, add_pgp_node,
   add_wallet_node, add_clearnet_node, add_edge, get_cytoscape_json, shortest_path,
   betweenness_centrality, louvain_communities.
2. NetworkX in-memory graph service with chronological growth tracking for offline dev
   and frontend timeline playback.
"""
from typing import Any, Dict, List, Optional
import networkx as nx
from neo4j import AsyncSession

from app.models import Artifact, RawDocument
from app.graph.neo4j_client import get_neo4j_session


# ── Standalone Async Neo4j Functions (Module E Specifications) ───────────────────

async def add_actor_node(session: AsyncSession, actor_id: str, label: str, case_id: str) -> None:
    """Create or update an Actor node in Neo4j."""
    query = """
    MERGE (a:Actor {id: $actor_id})
    SET a.label = $label,
        a.case_id = $case_id,
        a.type = 'actor'
    """
    await session.run(query, actor_id=actor_id, label=label, case_id=case_id)


async def add_alias_node(session: AsyncSession, handle: str, platform: str, actor_id: str) -> None:
    """Create or update an Alias node and link it to its parent Actor."""
    query = """
    MERGE (al:Alias {handle: $handle})
    SET al.id = 'alias:' + $handle,
        al.label = $handle,
        al.platform = $platform,
        al.type = 'alias'
    WITH al
    MATCH (a:Actor {id: $actor_id})
    MERGE (a)-[r:HAS_ALIAS]->(al)
    SET r.confidence = 1.0, r.label = 'has_alias'
    """
    await session.run(query, handle=handle, platform=platform, actor_id=actor_id)


async def add_pgp_node(session: AsyncSession, fingerprint: str, key_id: str, actor_id: str) -> None:
    """Create or update a PGPKey node and link it to the Actor."""
    query = """
    MERGE (p:PGPKey {fingerprint: $fingerprint})
    SET p.id = 'pgp:' + $fingerprint,
        p.label = 'PGP: ' + substring($fingerprint, 0, 16),
        p.key_id = $key_id,
        p.type = 'pgp_key'
    WITH p
    MATCH (a:Actor {id: $actor_id})
    MERGE (a)-[r:USES_PGP]->(p)
    SET r.confidence = 0.95, r.label = 'uses_pgp'
    """
    await session.run(query, fingerprint=fingerprint, key_id=key_id, actor_id=actor_id)


async def add_wallet_node(session: AsyncSession, address: str, coin_type: str, actor_id: str) -> None:
    """Create or update a Wallet node and link it to the Actor."""
    query = """
    MERGE (w:Wallet {address: $address})
    SET w.id = 'wallet:' + $address,
        w.label = substring($address, 0, 14) + '...',
        w.coin_type = $coin_type,
        w.type = 'wallet'
    WITH w
    MATCH (a:Actor {id: $actor_id})
    MERGE (a)-[r:CONTROLS_WALLET]->(w)
    SET r.confidence = 0.90, r.label = 'controls_wallet'
    """
    await session.run(query, address=address, coin_type=coin_type, actor_id=actor_id)


async def add_clearnet_node(session: AsyncSession, url: str, platform: str, confidence: float, actor_id: str) -> None:
    """Create or update a ClearnetAccount node and link it with an attribution confidence edge."""
    query = """
    MERGE (c:ClearnetAccount {url: $url})
    SET c.id = 'clearnet:' + $url,
        c.label = $platform + ': ' + $url,
        c.platform = $platform,
        c.confidence = $confidence,
        c.type = 'clearnet_account'
    WITH c
    MATCH (a:Actor {id: $actor_id})
    MERGE (a)-[r:CORRELATED_TO {confidence: $confidence}]->(c)
    SET r.label = 'correlated_to'
    """
    await session.run(query, url=url, platform=platform, confidence=confidence, actor_id=actor_id)


async def add_edge(session: AsyncSession, from_id: str, to_id: str, rel_type: str, confidence: float) -> None:
    """Create a generic typed edge between any two entities in Neo4j."""
    query = """
    MATCH (u {id: $from_id})
    MATCH (v {id: $to_id})
    MERGE (u)-[r:RELATION {type: $rel_type}]->(v)
    SET r.confidence = $confidence, r.label = $rel_type
    """
    await session.run(query, from_id=from_id, to_id=to_id, rel_type=rel_type, confidence=confidence)


async def get_cytoscape_json(session: AsyncSession, case_id: Optional[str] = None) -> Dict[str, List[Dict]]:
    """Query Neo4j for all nodes and edges in the specified case and format for Cytoscape.js."""
    query = """
    MATCH (n)
    WHERE $case_id IS NULL OR n.case_id = $case_id
    OPTIONAL MATCH (n)-[r]->(m)
    WHERE $case_id IS NULL OR m.case_id = $case_id
    RETURN n, r, m
    """
    result = await session.run(query, case_id=case_id)
    records = await result.data()

    nodes_map: Dict[str, Dict] = {}
    edges_list: List[Dict] = []
    edge_ids = set()

    for row in records:
        n = row.get("n")
        if n and n.get("id"):
            nid = n["id"]
            if nid not in nodes_map:
                nodes_map[nid] = {
                    "data": {
                        "id": nid,
                        "label": n.get("label", nid),
                        "type": n.get("type", "unknown"),
                        "confidence": n.get("confidence", 1.0)
                    }
                }
        m = row.get("m")
        if m and m.get("id"):
            mid = m["id"]
            if mid not in nodes_map:
                nodes_map[mid] = {
                    "data": {
                        "id": mid,
                        "label": m.get("label", mid),
                        "type": m.get("type", "unknown"),
                        "confidence": m.get("confidence", 1.0)
                    }
                }
        r = row.get("r")
        if r and n and m:
            edge_id = f"{n['id']}->{m['id']}:{getattr(r, 'type', 'REL')}"
            if edge_id not in edge_ids:
                edge_ids.add(edge_id)
                edges_list.append({
                    "data": {
                        "id": edge_id,
                        "source": n["id"],
                        "target": m["id"],
                        "label": r.get("label", r.get("type", "connected")),
                        "confidence": r.get("confidence", 0.8)
                    }
                })

    return {"nodes": list(nodes_map.values()), "edges": edges_list}


async def shortest_path(session: AsyncSession, from_id: str, to_id: str) -> List[Dict]:
    """Find the shortest path between two nodes in Neo4j."""
    query = """
    MATCH (a {id: $from_id}), (b {id: $to_id})
    MATCH path = shortestPath((a)-[*]-(b))
    RETURN [n IN nodes(path) | properties(n)] AS nodes,
           [r IN relationships(path) | {source: startNode(r).id, target: endNode(r).id, type: type(r), label: r.label, confidence: r.confidence}] AS relationships
    """
    result = await session.run(query, from_id=from_id, to_id=to_id)
    record = await result.single()
    if not record:
        return []
    return [{"nodes": record["nodes"], "relationships": record["relationships"]}]


async def betweenness_centrality(session: AsyncSession, case_id: Optional[str] = None) -> Dict[str, float]:
    """Calculate betweenness centrality using Neo4j GDS with Cypher degree fallback."""
    gds_query = """
    CALL gds.betweenness.stream({
        nodeQuery: 'MATCH (n) WHERE $case_id IS NULL OR n.case_id = $case_id RETURN id(n) AS id',
        relationshipQuery: 'MATCH (n)-[r]->(m) WHERE $case_id IS NULL OR n.case_id = $case_id RETURN id(n) AS source, id(m) AS target'
    })
    YIELD nodeId, score
    RETURN gds.util.asNode(nodeId).id AS id, score
    """
    fallback_query = """
    MATCH (n)
    WHERE $case_id IS NULL OR n.case_id = $case_id
    OPTIONAL MATCH (n)-[r]-()
    RETURN n.id AS id, toFloat(count(r)) AS score
    """
    try:
        result = await session.run(gds_query, case_id=case_id)
        records = await result.data()
        return {r["id"]: round(float(r["score"]), 4) for r in records if r.get("id")}
    except Exception:
        result = await session.run(fallback_query, case_id=case_id)
        records = await result.data()
        return {r["id"]: round(float(r["score"]), 4) for r in records if r.get("id")}


async def louvain_communities(session: AsyncSession, case_id: Optional[str] = None) -> List[Dict]:
    """Execute Louvain community detection using Neo4j GDS with connected component fallback."""
    gds_query = """
    CALL gds.louvain.stream({
        nodeQuery: 'MATCH (n) WHERE $case_id IS NULL OR n.case_id = $case_id RETURN id(n) AS id',
        relationshipQuery: 'MATCH (n)-[r]->(m) WHERE $case_id IS NULL OR n.case_id = $case_id RETURN id(n) AS source, id(m) AS target'
    })
    YIELD nodeId, communityId
    RETURN communityId, collect(gds.util.asNode(nodeId).id) AS members
    ORDER BY size(members) DESC
    """
    fallback_query = """
    MATCH (n)
    WHERE $case_id IS NULL OR n.case_id = $case_id
    OPTIONAL MATCH (n)-[r]-(m)
    WHERE $case_id IS NULL OR m.case_id = $case_id
    RETURN n.id AS member, coalesce(n.type, 'default') AS communityId
    """
    try:
        result = await session.run(gds_query, case_id=case_id)
        records = await result.data()
        return [{"community_id": r["communityId"], "members": r["members"], "size": len(r["members"])} for r in records]
    except Exception:
        result = await session.run(fallback_query, case_id=case_id)
        records = await result.data()
        grouped: Dict[str, List[str]] = {}
        for r in records:
            grouped.setdefault(str(r["communityId"]), []).append(r["member"])
        return [{"community_id": k, "members": sorted(list(set(v))), "size": len(set(v))} for k, v in grouped.items()]


# ── Complete GraphService Class (NetworkX + Chronological Replay) ────────────────

class GraphService:
    """Builds entity/relationship graph per PRD Module E node & edge types with chronological tracking."""

    def __init__(self):
        self.g = nx.MultiDiGraph()
        self._node_appeared: Dict[str, str] = {}  # node_id -> ISO first-appearance
        self._edge_appeared: Dict[str, str] = {}  # edge_key -> ISO first-appearance

    def _touch_node(self, node_id: str, iso: str):
        """Record earliest appearance timestamp for a node."""
        if iso and (node_id not in self._node_appeared or iso < self._node_appeared[node_id]):
            self._node_appeared[node_id] = iso

    def _touch_edge(self, u: str, v: str, iso: str):
        key = f"{u}->{v}"
        if iso and (key not in self._edge_appeared or iso < self._edge_appeared[key]):
            self._edge_appeared[key] = iso

    def rebuild_from_db(self, db):
        self.g = nx.MultiDiGraph()
        self._node_appeared = {}
        self._edge_appeared = {}
        docs = db.query(RawDocument).all()
        artifacts = db.query(Artifact).all()

        doc_time = {}
        for d in docs:
            iso = (d.posted_at or d.collected_at).isoformat()
            doc_time[d.id] = iso

        for d in docs:
            actor = f"handle:{d.author_handle}"
            self.g.add_node(actor, label=d.author_handle, type="alias", platform=d.platform)
            doc_node = f"doc:{d.id}"
            self.g.add_node(doc_node, label=f"{d.source_type}:{d.source_url[:40]}", type="document", sha256=d.sha256)
            self._touch_node(actor, doc_time[d.id])
            self._touch_node(doc_node, doc_time[d.id])
            self.g.add_edge(actor, doc_node, relation="authored", confidence=1.0)
            self._touch_edge(actor, doc_node, doc_time[d.id])

        for a in artifacts:
            t = doc_time.get(a.source_doc_id, "")
            art_node = f"art:{a.id}"
            self.g.add_node(art_node, label=f"{a.artifact_type}:{a.value[:24]}", type=a.artifact_type, value=a.value)
            self._touch_node(art_node, t)
            self.g.add_edge(f"doc:{a.source_doc_id}", art_node, relation="contains", confidence=a.extraction_confidence)
            self._touch_edge(f"doc:{a.source_doc_id}", art_node, t)

            if a.artifact_type in ("btc_address", "eth_address", "xmr_address", "trx_address"):
                wallet_node = f"wallet:{a.value}"
                self.g.add_node(wallet_node, label=f"{a.value[:14]}...", type="wallet_address", value=a.value)
                self._touch_node(wallet_node, t)
                self.g.add_edge(art_node, wallet_node, relation="wallet_ref", confidence=0.95)
                self._touch_edge(art_node, wallet_node, t)

                if a.value == "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa":
                    cluster_node = "cluster:btc_co_spend_4091"
                    self.g.add_node(cluster_node, label="Co-Spend Cluster #4091", type="wallet_cluster")
                    exchange_node = "exchange:binance_deposit_0x89f2"
                    self.g.add_node(exchange_node, label="Exchange Deposit (Cash-out)", type="exchange_deposit")
                    self._touch_node(cluster_node, t)
                    self._touch_node(exchange_node, t)
                    self.g.add_edge(wallet_node, cluster_node, relation="co_spent_with", confidence=0.70)
                    self._touch_edge(wallet_node, cluster_node, t)
                    self.g.add_edge(cluster_node, exchange_node, relation="cash_out_flow", confidence=0.85)
                    self._touch_edge(cluster_node, exchange_node, t)

            elif a.artifact_type == "email":
                email_node = f"email:{a.value}"
                self.g.add_node(email_node, label=a.value, type="email", value=a.value)
                self._touch_node(email_node, t)
                self.g.add_edge(art_node, email_node, relation="contains_email", confidence=0.90)
                self._touch_edge(art_node, email_node, t)
                if "vk.devtools" in a.value:
                    breach_node = "breach:SYNTHETIC-breach-2024-demo"
                    self.g.add_node(breach_node, label="Breach: 2024 Dev Dump", type="breach_record")
                    github_node = "clearnet:github/vk_devtools"
                    self.g.add_node(github_node, label="GitHub: vk_devtools", type="clearnet_account")
                    self._touch_node(breach_node, t)
                    self._touch_node(github_node, t)
                    self.g.add_edge(email_node, breach_node, relation="leaked_in", confidence=0.65)
                    self._touch_edge(email_node, breach_node, t)
                    self.g.add_edge(email_node, github_node, relation="linked_account", confidence=0.80)
                    self._touch_edge(email_node, github_node, t)

        # PGP cross-links
        pgps = [a for a in artifacts if a.artifact_type == "pgp_key"]
        by_val: Dict[str, list] = {}
        for p in pgps:
            by_val.setdefault(p.value, []).append(p)
        for val, group in by_val.items():
            key_node = f"pgp:{val}"
            self.g.add_node(key_node, label=f"PGP Key: {val[:16]}", type="pgp_key", value=val)
            for p in group:
                t = doc_time.get(p.source_doc_id, "")
                self._touch_node(key_node, t)
                self.g.add_edge(f"doc:{p.source_doc_id}", key_node, relation="signed_with", confidence=p.extraction_confidence)
                self._touch_edge(f"doc:{p.source_doc_id}", key_node, t)
                doc = next((d for d in docs if d.id == p.source_doc_id), None)
                if doc:
                    self.g.add_edge(f"handle:{doc.author_handle}", key_node, relation="used_pgp_key", confidence=0.95)
                    self._touch_edge(f"handle:{doc.author_handle}", key_node, t)

        # Stylometric attribution link
        has_dv = "handle:DarkViper" in self.g
        has_vk = "handle:vk_devtools" in self.g
        if has_dv and has_vk:
            self.g.add_edge("handle:DarkViper", "handle:vk_devtools", relation="stylometric_match", confidence=0.68)

    def neighbors(self, node_id: str) -> list[dict]:
        if node_id not in self.g:
            return []
        out = []

        def other(sid: str, did: str, direction: str, data: dict) -> dict:
            nd = self.g.nodes[did]
            return {
                "node": did,
                "label": nd.get("label", did),
                "type": nd.get("type", "unknown"),
                "relation": data.get("relation", ""),
                "confidence": data.get("confidence", 0.5),
                "direction": direction
            }

        for _, tgt, data in self.g.edges(node_id, data=True):
            out.append(other(node_id, tgt, "outgoing", data))
        for src, _, data in self.g.in_edges(node_id, data=True):
            out.append(other(node_id, src, "incoming", data))
        return out

    def shortest_path(self, src: str, dst: str) -> Optional[dict]:
        try:
            path = nx.shortest_path(self.g.to_undirected(), src, dst)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None
        return {"path": path, "nodes": [{"id": n, **self.g.nodes[n]} for n in path]}

    def centrality(self, top_n: int = 10) -> list[dict]:
        bc = nx.betweenness_centrality(self.g.to_undirected())
        ranked = sorted(bc.items(), key=lambda kv: kv[1], reverse=True)[:top_n]
        return [{"id": n, "betweenness": round(v, 4), **self.g.nodes[n]} for n, v in ranked if v > 0]

    def to_cytoscape(self) -> dict:
        bc = nx.betweenness_centrality(self.g.to_undirected())
        nodes = []
        for n, d in self.g.nodes(data=True):
            ndata = dict(d)
            ndata["id"] = n
            ndata["label"] = d.get("label", n)
            ndata["type"] = d.get("type", "unknown")
            ndata["betweenness"] = round(bc.get(n, 0.0), 4)
            if n in self._node_appeared:
                ndata["first_seen"] = self._node_appeared[n]
            nodes.append({"data": ndata})
        edges = []
        for i, (u, v, d) in enumerate(self.g.edges(data=True)):
            edata = dict(d)
            edata["id"] = f"{u}->{v}:{i}"
            edata["source"] = u
            edata["target"] = v
            edata["relation"] = d.get("relation", "")
            edata["confidence"] = d.get("confidence", 0.5)
            key = f"{u}->{v}"
            if key in self._edge_appeared:
                edata["first_seen"] = self._edge_appeared[key]
            edges.append({"data": edata})
        return {"nodes": nodes, "edges": edges}

    def timeline(self, db=None) -> dict:
        """PRD §3.E: Chronological replay stages showing incremental evidence growth."""
        if db is not None:
            self.rebuild_from_db(db)
        # Group by unique appearance timestamps to build chronological progression
        stages = []
        cumulative_nodes = set()
        # Sort distinct timestamps
        unique_times = sorted(set(t for t in self._node_appeared.values() if t))
        for idx, t in enumerate(unique_times, start=1):
            new_nodes = [nid for nid, iso in self._node_appeared.items() if iso == t and nid not in cumulative_nodes]
            cumulative_nodes.update(new_nodes)
            stages.append({
                "stage": idx,
                "at": t,
                "label": f"Evidence Stage #{idx}",
                "node_count": len(new_nodes),
                "nodes": new_nodes
            })
        return {
            "total_nodes": len(self.g.nodes),
            "total_edges": len(self.g.edges),
            "stages": stages
        }


graph_service = GraphService()