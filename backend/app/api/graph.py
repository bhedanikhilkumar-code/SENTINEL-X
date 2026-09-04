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


class AnnotateBody(BaseModel):
    node_id: str
    note: str
    author: str = "analyst_demo"


@router.get("/{case_id}/cytoscape")
async def get_case_cytoscape(case_id: str, db: Session = Depends(get_db)):
    """Fetch all graph nodes and edges for a specific case formatted for Cytoscape.js."""
    try:
        async with get_neo4j_session() as session:
            data = await gs.get_cytoscape_json(session, case_id=case_id)
            if data and data.get("nodes"):
                return data
    except Exception:
        pass
    # Fallback to in-memory graph service
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
    result = graph_service.shortest_path(from_id, to_id)
    if result is None:
        raise HTTPException(404, "No path found between the specified entities")
    return result


@router.get("/{case_id}/centrality")
async def get_case_centrality(case_id: str, db: Session = Depends(get_db)):
    """Calculate betweenness centrality to identify key intelligence bridge nodes."""
    try:
        async with get_neo4j_session() as session:
            cent = await gs.betweenness_centrality(session)
            if cent:
                return cent
    except Exception:
        pass
    graph_service.rebuild_from_db(db)
    return graph_service.centrality()


@router.get("/{case_id}/communities")
async def get_case_communities(case_id: str, db: Session = Depends(get_db)):
    """Run Louvain community detection to group clusters of aliases and infrastructure."""
    try:
        async with get_neo4j_session() as session:
            comms = await gs.louvain_communities(session)
            if comms and comms.get("communities"):
                return comms
    except Exception:
        pass
    # NetworkX Louvain fallback
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


@router.post("/{case_id}/annotate")
def add_case_annotation(
    case_id: str,
    body: AnnotateBody,
    user=Depends(require_role("analyst")),
    db: Session = Depends(get_db)
):
    """Add an analyst note or observation to a graph node."""
    from app.models import GraphAnnotation
    from app.modules.audit import append_audit

    ann = GraphAnnotation(
        node_id=body.node_id,
        note=body.note,
        author=user.username if user else body.author
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)

    append_audit(
        db,
        actor=user.username if user else body.author,
        action="graph.annotated",
        entity_ids=[case_id, ann.id],
        detail=f"Annotated node {body.node_id}: {body.note[:40]}..."
    )

    return {"status": "ok", "annotation_id": ann.id, "node_id": ann.node_id, "note": ann.note}
