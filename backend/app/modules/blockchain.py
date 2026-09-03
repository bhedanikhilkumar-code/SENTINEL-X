"""Module D — Blockchain Clustering, Mixer Tracing, and Risk Scoring Engine (PRD 3.D)."""
import logging
import hashlib
from typing import Dict, List, Optional, Set, Tuple
import requests
from sqlalchemy.orm import Session

from app.models import WalletCluster, Artifact
from app.modules.audit import append_audit

logger = logging.getLogger("sentinelx.blockchain")

# Known high-risk entities, mixer pools, and exchange clusters
KNOWN_MIXER_ADDRESSES = {
    # Wasabi / Samourai CoinJoin coordinators & liquidity pools
    "bc1qa5wkgaew2dkv56kfvj49j0av5nml45x9ek9hz6": {"name": "Wasabi CoinJoin 2.0 Pool", "type": "mixer"},
    "3MixerWasabiPoolAddressXYZ9876543210abcd": {"name": "Wasabi 1.0 Coordinator", "type": "mixer"},
    "bc1qs4m0ur41wh1rlp00lxxxxxxxxxxxxxxxxx": {"name": "Samourai Whirlpool 0.05 BTC", "type": "mixer"},
    # Tornado Cash Ethereum contracts
    "0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b": {"name": "Tornado.Cash: 0.1 ETH", "type": "mixer"},
    "0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936": {"name": "Tornado.Cash: 1 ETH", "type": "mixer"},
    "0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF": {"name": "Tornado.Cash: 10 ETH", "type": "mixer"},
}

KNOWN_EXCHANGE_DEPOSITS = {
    "1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s": {"name": "Binance Hot Wallet 6", "exchange": "Binance", "kyc": True},
    "3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5": {"name": "Huobi Global Deposit", "exchange": "Huobi", "kyc": True},
    "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h": {"name": "Kraken Custody Deposit", "exchange": "Kraken", "kyc": True},
    "0x28C6c06298d514Db089934071355E5743bf21d60": {"name": "Binance 14 Deposit", "exchange": "Binance", "kyc": True},
    "0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549": {"name": "Binance Hot Wallet", "exchange": "Binance", "kyc": True},
}

KNOWN_DARKNET_WALLETS = {
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa": {"name": "PHANTOM-KRYPT Ransom Escrow", "tag": "ransomware"},
    "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy": {"name": "DarkViper Dread Payout", "tag": "darknet_market"},
    "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq": {"name": "KryptSec Exploit Sale", "tag": "exploit_broker"},
    "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed": {"name": "PHANTOM-ETH Decryption Smart Wallet", "tag": "ransomware"},
}

# Synthetic transaction ledger graph for offline deterministic demonstration
SYNTHETIC_TRANSACTIONS = [
    {
        "txid": "7a3f89e2b1c4d5a6e7f8091234567890abcdef1234567890abcdef1234567890",
        "inputs": [
            {"address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "amount": 12.50000000},
            {"address": "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy", "amount": 2.50000000}
        ],
        "outputs": [
            {"address": "bc1qpeelhop1xxxxxxxxxxxxxxxxxxxxxxxxxx", "amount": 14.85000000, "is_change": True},
            {"address": "1ExtortionFeeCollector11111111111111", "amount": 0.14950000, "is_change": False}
        ],
        "fee": 0.00050000,
        "timestamp": "2026-08-15T14:22:10Z",
        "is_coinjoin": False
    },
    {
        "txid": "3b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6",
        "inputs": [
            {"address": "bc1qpeelhop1xxxxxxxxxxxxxxxxxxxxxxxxxx", "amount": 14.85000000}
        ],
        "outputs": [
            {"address": "bc1qpeelhop2yyyyyyyyyyyyyyyyyyyyyyyyyy", "amount": 14.50000000, "is_change": True},
            {"address": "bc1qa5wkgaew2dkv56kfvj49j0av5nml45x9ek9hz6", "amount": 0.34950000, "is_change": False}  # Washer hop
        ],
        "fee": 0.00050000,
        "timestamp": "2026-08-15T16:04:33Z",
        "is_coinjoin": False
    },
    {
        "txid": "9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b",
        "inputs": [
            {"address": "bc1qa5wkgaew2dkv56kfvj49j0av5nml45x9ek9hz6", "amount": 0.34950000},
            {"address": "bc1qanothervictim1111111111111111111111", "amount": 0.35000000},
            {"address": "bc1qanothervictim2222222222222222222222", "amount": 0.35000000},
            {"address": "bc1qanothervictim3333333333333333333333", "amount": 0.35000000}
        ],
        "outputs": [
            {"address": "bc1qmixedout11111111111111111111111111", "amount": 0.34000000, "is_change": False},
            {"address": "bc1qmixedout22222222222222222222222222", "amount": 0.34000000, "is_change": False},
            {"address": "bc1qmixedout33333333333333333333333333", "amount": 0.34000000, "is_change": False},
            {"address": "bc1qmixedout44444444444444444444444444", "amount": 0.34000000, "is_change": False}
        ],
        "fee": 0.03950000,
        "timestamp": "2026-08-15T18:30:00Z",
        "is_coinjoin": True
    },
    {
        "txid": "f5e4d3c2b1a09876543210abcdef0123456789abcdef0123456789abcdef0123",
        "inputs": [
            {"address": "bc1qpeelhop2yyyyyyyyyyyyyyyyyyyyyyyyyy", "amount": 14.50000000}
        ],
        "outputs": [
            {"address": "bc1qpeelhop3zzzzzzzzzzzzzzzzzzzzzzzzzz", "amount": 10.00000000, "is_change": True},
            {"address": "1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s", "amount": 4.49950000, "is_change": False}  # Binance Deposit!
        ],
        "fee": 0.00050000,
        "timestamp": "2026-08-16T09:12:45Z",
        "is_coinjoin": False
    }
]


# ── Common-Input Clustering (Disjoint Set Union) ─────────────────────────────

class DisjointSet:
    def __init__(self):
        self.parent: Dict[str, str] = {}

    def find(self, item: str) -> str:
        if item not in self.parent:
            self.parent[item] = item
            return item
        if self.parent[item] != item:
            self.parent[item] = self.find(self.parent[item])
        return self.parent[item]

    def union(self, a: str, b: str):
        root_a = self.find(a)
        root_b = self.find(b)
        if root_a != root_b:
            self.parent[root_b] = root_a


def cluster_addresses(
    addresses: Optional[List[str]] = None,
    db: Optional[Session] = None,
    case_id: Optional[str] = None
) -> List[dict]:
    """
    Common-Input-Ownership Clustering (PRD §3.D):
    Addresses co-spent as inputs in the same transaction belong to the same entity.
    """
    dsu = DisjointSet()
    observed_addresses = set(addresses or [])

    # Feed synthetic + explorer transactions
    for tx in SYNTHETIC_TRANSACTIONS:
        if tx.get("is_coinjoin"):
            continue  # CoinJoin breaks common-input ownership heuristic
        in_addrs = [inp["address"] for inp in tx.get("inputs", []) if "address" in inp]
        if len(in_addrs) >= 2:
            first = in_addrs[0]
            observed_addresses.add(first)
            for other in in_addrs[1:]:
                observed_addresses.add(other)
                dsu.union(first, other)
        elif len(in_addrs) == 1:
            observed_addresses.add(in_addrs[0])

    # Build cluster mapping
    clusters_map: Dict[str, List[str]] = {}
    for addr in observed_addresses:
        root = dsu.find(addr)
        clusters_map.setdefault(root, []).append(addr)

    results = []
    for root, addrs in clusters_map.items():
        # Check if any address is exchange or mixer
        has_exchange = any(a in KNOWN_EXCHANGE_DEPOSITS for a in addrs)
        has_darknet = any(a in KNOWN_DARKNET_WALLETS for a in addrs)
        
        # Calculate cluster confidence: single address = 0.5, multiple co-spends = 0.92
        confidence = 0.92 if len(addrs) > 1 else 0.60
        cluster_type = "btc_co_spend"
        if any(a.startswith("0x") for a in addrs):
            cluster_type = "eth_contract"

        cluster_info = {
            "cluster_id": hashlib.sha256(",".join(sorted(addrs)).encode()).hexdigest()[:16],
            "addresses": sorted(addrs),
            "address_count": len(addrs),
            "cluster_type": cluster_type,
            "exchange_flag": has_exchange,
            "darknet_flag": has_darknet,
            "confidence": confidence,
            "labels": [KNOWN_DARKNET_WALLETS[a]["name"] for a in addrs if a in KNOWN_DARKNET_WALLETS] +
                      [KNOWN_EXCHANGE_DEPOSITS[a]["name"] for a in addrs if a in KNOWN_EXCHANGE_DEPOSITS]
        }
        results.append(cluster_info)

        # Persist to database if session provided
        if db is not None:
            all_clusters = db.query(WalletCluster).all()
            existing = any(any(a in (c.addresses or []) for a in addrs) for c in all_clusters)
            
            if not existing:
                record = WalletCluster(
                    addresses=addrs,
                    cluster_type=cluster_type,
                    exchange_flag=has_exchange,
                    confidence=confidence,
                    case_id=case_id
                )
                db.add(record)

    if db is not None:
        try:
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.warning(f"Could not persist wallet clusters to DB: {exc}")

    return sorted(results, key=lambda c: len(c["addresses"]), reverse=True)


# ── Peel Chain & Mixer Detection ─────────────────────────────────────────────

def detect_coinjoin(tx: dict) -> dict:
    """
    CoinJoin heuristic:
    - Multiple inputs (>2)
    - Equal-denomination outputs with minimal variance
    - High anonymity set
    """
    outputs = tx.get("outputs", [])
    if len(outputs) < 2:
        return {"is_coinjoin": False, "anonymity_set": 1, "confidence": 0.0}

    amounts = [o.get("amount", 0.0) for o in outputs]
    # Check frequency of mode amount
    counts = {}
    for a in amounts:
        counts[a] = counts.get(a, 0) + 1

    max_equal = max(counts.values()) if counts else 0
    is_cj = (len(tx.get("inputs", [])) >= 3 and max_equal >= 3)

    return {
        "is_coinjoin": is_cj,
        "anonymity_set": max_equal if is_cj else 1,
        "equal_amount": [amt for amt, cnt in counts.items() if cnt == max_equal][0] if is_cj else 0.0,
        "confidence": 0.95 if is_cj else 0.0
    }


def detect_peel_chain(start_address: str, max_hops: int = 5) -> dict:
    """
    Peel Chain Detection (PRD §3.D):
    A high-volume wallet peeling off small expenditure outputs while forwarding
    the remainder change output to the next hop.
    """
    hops = []
    curr_addr = start_address
    total_peeled_amount = 0.0
    terminal_destination = None

    for hop_idx in range(max_hops):
        # Look for a tx where curr_addr is an input
        matching_tx = None
        for tx in SYNTHETIC_TRANSACTIONS:
            in_addrs = [i["address"] for i in tx["inputs"]]
            if curr_addr in in_addrs:
                matching_tx = tx
                break

        if not matching_tx:
            break

        outputs = matching_tx["outputs"]
        change_output = None
        payment_output = None

        # Heuristic: larger output is change, smaller output is payment/peel
        if len(outputs) >= 2:
            sorted_outs = sorted(outputs, key=lambda x: x["amount"], reverse=True)
            change_output = sorted_outs[0]
            payment_output = sorted_outs[1]
        elif len(outputs) == 1:
            payment_output = outputs[0]

        peel_amount = payment_output["amount"] if payment_output else 0.0
        total_peeled_amount += peel_amount

        payee_addr = payment_output["address"] if payment_output else "unknown"
        payee_label = "Unknown Entity"
        if payee_addr in KNOWN_EXCHANGE_DEPOSITS:
            payee_label = f"EXCHANGE: {KNOWN_EXCHANGE_DEPOSITS[payee_addr]['name']}"
            terminal_destination = payee_addr
        elif payee_addr in KNOWN_MIXER_ADDRESSES:
            payee_label = f"MIXER: {KNOWN_MIXER_ADDRESSES[payee_addr]['name']}"
            terminal_destination = payee_addr

        hop_record = {
            "hop_number": hop_idx + 1,
            "txid": matching_tx["txid"],
            "from_address": curr_addr,
            "payment_address": payee_addr,
            "payment_label": payee_label,
            "payment_amount": peel_amount,
            "change_address": change_output["address"] if change_output else None,
            "change_amount": change_output["amount"] if change_output else 0.0,
            "timestamp": matching_tx.get("timestamp")
        }
        hops.append(hop_record)

        if terminal_destination or not change_output:
            break

        curr_addr = change_output["address"]

    return {
        "start_address": start_address,
        "is_peel_chain": len(hops) >= 2,
        "total_hops": len(hops),
        "total_peeled_amount": round(total_peeled_amount, 6),
        "terminal_destination": terminal_destination,
        "terminal_entity": KNOWN_EXCHANGE_DEPOSITS.get(terminal_destination, {}).get("name") or
                           KNOWN_MIXER_ADDRESSES.get(terminal_destination, {}).get("name"),
        "hops": hops
    }


# ── Risk Scoring Engine ──────────────────────────────────────────────────────

def calculate_address_risk(address: str) -> dict:
    """
    Calculates forensic risk score (0.0 to 1.0) and deanonymization potential.
    """
    tags = []
    score = 0.15  # baseline
    direct_mixer = False
    direct_darknet = False
    exchange_lead = False

    # 1. Known tags
    if address in KNOWN_DARKNET_WALLETS:
        entry = KNOWN_DARKNET_WALLETS[address]
        tags.append(entry.get("tag", "darknet").upper())
        tags.append(entry.get("name"))
        score += 0.55
        direct_darknet = True

    if address in KNOWN_MIXER_ADDRESSES:
        tags.append("MIXER_CONTRACT")
        tags.append(KNOWN_MIXER_ADDRESSES[address]["name"])
        score += 0.50
        direct_mixer = True

    if address in KNOWN_EXCHANGE_DEPOSITS:
        tags.append("EXCHANGE_DEPOSIT")
        tags.append(KNOWN_EXCHANGE_DEPOSITS[address]["name"])
        # Exchange presence enables deanonymization via subpoena / §91 CrPC
        exchange_lead = True

    # 2. Check peel chain behavior
    peel = detect_peel_chain(address)
    if peel["is_peel_chain"]:
        tags.append("PEEL_CHAIN_ORIGIN")
        score += 0.20
        if peel.get("terminal_destination") in KNOWN_EXCHANGE_DEPOSITS:
            tags.append("EXCHANGE_CASHOUT_PATH")
            exchange_lead = True
        if peel.get("terminal_destination") in KNOWN_MIXER_ADDRESSES:
            tags.append("INDIRECT_MIXER_EXPOSURE")
            score += 0.25

    # 3. Check co-spend clusters
    clusters = cluster_addresses([address])
    associated_cluster = next((c for c in clusters if address in c["addresses"]), None)
    if associated_cluster and associated_cluster["address_count"] > 1:
        tags.append(f"CO_SPEND_CLUSTER_{associated_cluster['cluster_id']}")

    final_score = round(max(0.05, min(0.99, score)), 2)
    risk_level = "CRITICAL" if final_score >= 0.75 else "HIGH" if final_score >= 0.50 else "MODERATE" if final_score >= 0.30 else "LOW"

    return {
        "address": address,
        "risk_score": final_score,
        "risk_level": risk_level,
        "tags": list(set(tags)),
        "direct_darknet": direct_darknet,
        "direct_mixer": direct_mixer,
        "exchange_cashout_lead": exchange_lead,
        "subpoena_target": peel.get("terminal_entity") if exchange_lead else None
    }


# ── Multi-Hop Transaction Tracing Graph ──────────────────────────────────────

def trace_transactions(start_address: str, max_depth: int = 3) -> dict:
    """
    Constructs a Cytoscape-compatible transaction flow graph tracing hops from
    start_address to exchange cashouts or mixers.
    """
    nodes = []
    edges = []
    visited_addrs = set()
    visited_txs = set()

    def add_addr_node(addr: str):
        if addr in visited_addrs:
            return
        visited_addrs.add(addr)
        node_type = "wallet_address"
        label = addr[:6] + "..." + addr[-4:]

        if addr in KNOWN_DARKNET_WALLETS:
            node_type = "darknet_wallet"
            label = KNOWN_DARKNET_WALLETS[addr]["name"]
        elif addr in KNOWN_EXCHANGE_DEPOSITS:
            node_type = "exchange_deposit"
            label = KNOWN_EXCHANGE_DEPOSITS[addr]["name"]
        elif addr in KNOWN_MIXER_ADDRESSES:
            node_type = "mixer_pool"
            label = KNOWN_MIXER_ADDRESSES[addr]["name"]

        nodes.append({
            "data": {
                "id": addr,
                "label": label,
                "type": node_type,
                "address": addr,
                "risk": calculate_address_risk(addr)["risk_score"]
            }
        })

    add_addr_node(start_address)

    # Breadth-first exploration
    current_frontier = {start_address}
    cashout_path = []

    for depth in range(max_depth):
        next_frontier = set()
        for curr in current_frontier:
            for tx in SYNTHETIC_TRANSACTIONS:
                in_addrs = [i["address"] for i in tx["inputs"]]
                if curr in in_addrs:
                    tx_id = tx["txid"]
                    if tx_id not in visited_txs:
                        visited_txs.add(tx_id)
                        # Add tx intermediate node
                        tx_short = tx_id[:8] + "..."
                        nodes.append({
                            "data": {
                                "id": tx_id,
                                "label": f"TX: {tx_short}",
                                "type": "transaction",
                                "is_coinjoin": tx.get("is_coinjoin", False),
                                "fee": tx.get("fee", 0.0)
                            }
                        })

                    # Edge: input -> TX
                    edges.append({
                        "data": {
                            "id": f"e_{curr}_{tx_id}",
                            "source": curr,
                            "target": tx_id,
                            "relation": "INPUT_TO"
                        }
                    })

                    # Edges: TX -> outputs
                    for out in tx["outputs"]:
                        target_addr = out["address"]
                        add_addr_node(target_addr)
                        edges.append({
                            "data": {
                                "id": f"e_{tx_id}_{target_addr}",
                                "source": tx_id,
                                "target": target_addr,
                                "relation": "PAYS_OUT",
                                "amount": out["amount"],
                                "is_change": out.get("is_change", False)
                            }
                        })
                        next_frontier.add(target_addr)

                        if target_addr in KNOWN_EXCHANGE_DEPOSITS:
                            cashout_path = [start_address, tx_id, target_addr]

        current_frontier = next_frontier

    return {
        "start_address": start_address,
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "shortest_path_to_cashout": cashout_path,
        "cashout_detected": len(cashout_path) > 0,
        "elements": {
            "nodes": nodes,
            "edges": edges
        }
    }
