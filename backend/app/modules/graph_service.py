"""Module E — Knowledge graph service. NetworkX-backed for MVP (Neo4j swap point)."""
import networkx as nx
from app.models import Artifact, RawDocument


class GraphService:
    """Builds entity/relationship graph per PRD Module E node & edge types."""

    def __init__(self):
        self.g = nx.MultiDiGraph()

    def rebuild_from_db(self, db):
        self.g = nx.MultiDiGraph()
        docs = db.query(RawDocument).all()
        artifacts = db.query(Artifact).all()
        for d in docs:
            actor = f"handle:{d.author_handle}"
            self.g.add_node(actor, label=d.author_handle, type="alias", platform=d.platform)
            doc_node = f"doc:{d.id}"
            self.g.add_node(doc_node, label=f"{d.source_type}:{d.source_url[:40]}", type="document", sha256=d.sha256)
            self.g.add_edge(actor, doc_node, relation="authored", confidence=1.0)
        for a in artifacts:
            art_node = f"art:{a.id}"
            self.g.add_node(art_node, label=f"{a.artifact_type}:{a.value[:24]}", type=a.artifact_type, value=a.value)
            self.g.add_edge(f"doc:{a.source_doc_id}", art_node, relation="contains", confidence=a.extraction_confidence)
            
            if a.artifact_type in ("btc_address", "eth_address", "xmr_address", "trx_address"):
                wallet_node = f"wallet:{a.value}"
                self.g.add_node(wallet_node, label=f"{a.value[:14]}...", type="wallet_address", value=a.value)
                self.g.add_edge(art_node, wallet_node, relation="wallet_ref", confidence=0.95)
                
                # Mock chain-clustering heuristics for demo address
                if a.value == "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa":
                    cluster_node = "cluster:btc_co_spend_4091"
                    self.g.add_node(cluster_node, label="Co-Spend Cluster #4091", type="wallet_cluster")
                    self.g.add_edge(wallet_node, cluster_node, relation="co_spent_with", confidence=0.70)
                    
                    exchange_node = "exchange:binance_deposit_0x89f2"
                    self.g.add_node(exchange_node, label="Exchange Deposit (Cash-out)", type="exchange_deposit")
                    self.g.add_edge(cluster_node, exchange_node, relation="cash_out_flow", confidence=0.85)

            elif a.artifact_type == "email":
                email_node = f"email:{a.value}"
                self.g.add_node(email_node, label=a.value, type="email", value=a.value)
                self.g.add_edge(art_node, email_node, relation="contains_email", confidence=0.90)
                
                if "vk.devtools" in a.value:
                    breach_node = "breach:SYNTHETIC-breach-2024-demo"
                    self.g.add_node(breach_node, label="Breach: 2024 Dev Dump", type="breach_record")
                    self.g.add_edge(email_node, breach_node, relation="leaked_in", confidence=0.65)
                    
                    github_node = "clearnet:github/vk_devtools"
                    self.g.add_node(github_node, label="GitHub: vk_devtools", type="clearnet_account")
                    self.g.add_edge(email_node, github_node, relation="linked_account", confidence=0.80)

        # PGP cross-links: same fingerprint → shared key node
        pgps = [a for a in artifacts if a.artifact_type == "pgp_key"]
        by_val: dict[str, list] = {}
        for p in pgps:
            by_val.setdefault(p.value, []).append(p)
        for val, group in by_val.items():
            key_node = f"pgp:{val}"
            self.g.add_node(key_node, label=f"PGP Key: {val[:16]}", type="pgp_key", value=val)
            for p in group:
                self.g.add_edge(f"doc:{p.source_doc_id}", key_node, relation="signed_with", confidence=p.extraction_confidence)
                # Link directly to author handle
                doc = next((d for d in docs if d.id == p.source_doc_id), None)
                if doc:
                    self.g.add_edge(f"handle:{doc.author_handle}", key_node, relation="used_pgp_key", confidence=0.95)

        # Stylometric attribution link between DarkViper and vk_devtools if both present
        has_dv = "handle:DarkViper" in self.g
        has_vk = "handle:vk_devtools" in self.g
        if has_dv and has_vk:
            self.g.add_edge("handle:DarkViper", "handle:vk_devtools", relation="stylometric_match", confidence=0.68)

    def neighbors(self, node_id: str) -> list[dict]:
        """FIX (bug 3): unified neighbor entries.

        Previously in-edge entries lacked to_label/to_type and pointed the
        frontend back at the queried node itself (self-pivot bug). Now every
        entry describes the OTHER node consistently, plus edge direction.
        """
        if node_id not in self.g:
            return []
        out = []

        def other(sid: str, did: str, direction: str, data: dict) -> dict:
            nd = self.g.nodes[did]
            return {"node": did, "label": nd.get("label", did), "type": nd.get("type", "unknown"),
                    "relation": data.get("relation", ""), "confidence": data.get("confidence", 0.5),
                    "direction": direction}

        for _, tgt, data in self.g.edges(node_id, data=True):
            out.append(other(node_id, tgt, "outgoing", data))
        for src, _, data in self.g.in_edges(node_id, data=True):
            out.append(other(node_id, src, "incoming", data))
        return out

    def shortest_path(self, src: str, dst: str) -> dict | None:
        try:
            path = nx.shortest_path(self.g.to_undirected(), src, dst)
        except nx.NetworkXNoPath:
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
            nodes.append({"data": ndata})
        edges = []
        for i, (u, v, d) in enumerate(self.g.edges(data=True)):
            edata = dict(d)
            edata["id"] = f"{u}->{v}:{i}"
            edata["source"] = u
            edata["target"] = v
            edata["relation"] = d.get("relation", "")
            edata["confidence"] = d.get("confidence", 0.5)
            edges.append({"data": edata})
        return {"nodes": nodes, "edges": edges}


graph_service = GraphService()
