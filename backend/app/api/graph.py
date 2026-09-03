"""Graph API — Neo4j-backed knowledge graph endpoints with Cytoscape.js support (Module E)."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.graph.neo4j_client import get_neo4j_session
from app.modules import graph_service as gs
from app.modules.graph_service import graph_service
from app.auth.dependencies import require_role

router = APIRouter(prefix="/api/graph", tags=["graph"])


class NodeCreate(BaseModel):
    id: str
    label: str
    type: str = "entity"
    properties: dict = {}


class EdgeCreate(BaseModel):
    from_id: str
    to_id: str
    rel_type: str
    confidence: float = 1.0


@router.get("/{case_id}/cytoscape")
async def get_case_cytoscape(case_id: str, db: Session = Depends(get_db)):
    """Fetch all graph nodes and edges for a specific case in Cytoscape.js format."""
    try:
        async with get_neo4j_session() as session:
            data = await gs.get_cytoscape_json(session, case_id=case_id)
            if data["nodes"]:
                return data
    except Exception:
        pass
    # Fallback to local graph_service if Neo4j is offline or empty
    graph_service.rebuild_from_db(db)
    return graph_service.to_cytoscape()


@router.get("/{case_id}/shortest-path")
async def get_case_shortest_path(
    case_id: str,
    from_id: str = Query(..., alias="from"),
    to_id: str = Query(..., alias="to"),
    db: Session = Depends(get_db)
):
    """Find the shortest path between two nodes in the graph."""
    try:
        async with get_neo4j_session() as session:
            paths = await gs.shortest_path(session, from_id=from_id, to_id=to_id)
            if paths:
                return paths[0]
    except Exception:
        pass
    # Fallback to NetworkX
    graph_service.rebuild_from_db(db)
    res = graph_service.shortest_path(from_id, to_id)
    if res is None:
        raise HTTPException(status_code=404, detail="No path found between the specified nodes")
    return res


@router.get("/{case_id}/centrality")
async def get_case_centrality(case_id: str, db: Session = Depends(get_db)):
    """Compute betweenness centrality for all nodes in the case graph."""
    try:
        async with get_neo4j_session() as session:
            scores = await gs.betweenness_centrality(session, case_id=case_id)
            if scores:
                return scores
    except Exception:
        pass
    # Fallback to NetworkX
    graph_service.rebuild_from_db(db)
    return graph_service.centrality()


@router.get("/{case_id}/communities")
async def get_case_communities(case_id: str, db: Session = Depends(get_db)):
    """Detect Louvain communities within the case graph."""
    try:
        async with get_neo4j_session() as session:
            comms = await gs.louvain_communities(session, case_id=case_id)
            if comms:
                return {"communities": comms}
    except Exception:
        pass
    # Fallback to NetworkX Louvain
    import networkx as nx
    graph_service.rebuild_from_db(db)
    undirected = graph_service.g.to_undirected()
    if len(undirected) == 0:
        return {"communities": []}
    comms = nx.community.louvain_communities(undirected, seed=42)
    return {
        "communities": [
            {
                "size": len(c),
                "nodes": [
                    {
                        "id": n,
                        "type": graph_service.g.nodes[n].get("type", "unknown"),
                        "label": graph_service.g.nodes[n].get("label", n)
                    }
                    for n in sorted(c)
                ]
            }
            for c in sorted(comms, key=len, reverse=True)
        ]
    }


@router.post("/{case_id}/node")
async def add_case_node(
    case_id: str,
    body: NodeCreate,
    user=Depends(require_role("analyst"))
):
    """Manually add an entity node to the case graph."""
    try:
        async with get_neo4j_session() as session:
            query = """
            MERGE (n:Entity {id: $id})
            SET n.label = $label,
                n.type = $type,
                n.case_id = $case_id,
                n += $properties
            RETURN n
            """
            await session.run(
                query,
                id=body.id,
                label=body.label,
                type=body.type,
                case_id=case_id,
                properties=body.properties
            )
            return {"status": "created", "node_id": body.id, "case_id": case_id}
    except Exception as exc:
        # Dev fallback: add to in-memory graph
        graph_service.g.add_node(body.id, label=body.label, type=body.type, case_id=case_id, **body.properties)
        return {"status": "created_in_memory", "node_id": body.id, "case_id": case_id, "note": str(exc)}


@router.post("/{case_id}/edge")
async def add_case_edge(
    case_id: str,
    body: EdgeCreate,
    user=Depends(require_role("analyst"))
):
    """Manually add a relationship edge between two nodes."""
    try:
        async with get_neo4j_session() as session:
            await gs.add_edge(
                session,
                from_id=body.from_id,
                to_id=body.to_id,
                rel_type=body.rel_type,
                confidence=body.confidence
            )
            return {
                "status": "created",
                "source": body.from_id,
                "target": body.to_id,
                "relation": body.rel_type,
                "confidence": body.confidence
            }
    except Exception as exc:
        # Dev fallback: add to in-memory graph
        graph_service.g.add_edge(body.from_id, body.to_id, relation=body.rel_type, confidence=body.confidence)
        return {
            "status": "created_in_memory",
            "source": body.from_id,
            "target": body.to_id,
            "relation": body.rel_type,
            "confidence": body.confidence,
            "note": str(exc)
        }
