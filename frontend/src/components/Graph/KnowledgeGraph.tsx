import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

interface KnowledgeGraphProps {
  elements?: {
    nodes: Array<{ data: { id: string; label: string; type: string; confidence?: number } }>;
    edges: Array<{ data: { id: string; source: string; target: string; label: string; confidence?: number } }>;
  };
  caseId?: string | number;
  layoutName?: string;
  onNodeClick?: (nodeData: any) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  elements: propElements,
  caseId,
  layoutName = 'cose',
  onNodeClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const defaultElements = {
    nodes: [
      { data: { id: 'actor:phantom_krypt', label: 'PHANTOM-KRYPT (Darknet)', type: 'actor', confidence: 1.0 } },
      { data: { id: 'alias:krypt_sec', label: 'alias: krypt_sec', type: 'alias', confidence: 0.95 } },
      { data: { id: 'pgp:4A7B8C9D', label: 'PGP: 4A7B8C9D...', type: 'pgp_key', confidence: 0.98 } },
      { data: { id: 'wallet:bc1qar0s', label: 'BTC: bc1qar0s...', type: 'wallet', confidence: 0.92 } },
      { data: { id: 'cluster:binance', label: 'Binance KYC Cluster', type: 'exchange', confidence: 0.89 } },
      { data: { id: 'clearnet:vsharma_dev', label: 'GitHub: vsharma_dev', type: 'clearnet', confidence: 0.91 } },
      { data: { id: 'identity:vikramaditya', label: 'Vikramaditya Sharma', type: 'target', confidence: 0.912 } },
    ],
    edges: [
      { data: { id: 'e1', source: 'actor:phantom_krypt', target: 'alias:krypt_sec', label: 'uses_alias' } },
      { data: { id: 'e2', source: 'actor:phantom_krypt', target: 'pgp:4A7B8C9D', label: 'signed_with' } },
      { data: { id: 'e3', source: 'actor:phantom_krypt', target: 'wallet:bc1qar0s', label: 'demands_ransom' } },
      { data: { id: 'e4', source: 'wallet:bc1qar0s', target: 'cluster:binance', label: 'peel_chain_cashout' } },
      { data: { id: 'e5', source: 'pgp:4A7B8C9D', target: 'clearnet:vsharma_dev', label: 'key_reused_dotfiles' } },
      { data: { id: 'e6', source: 'clearnet:vsharma_dev', target: 'identity:vikramaditya', label: 'de_anonymized_anchor' } },
    ],
  };

  const elements = propElements || defaultElements;

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy prior instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...elements.nodes, ...elements.edges],
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#ffffff',
            'font-family': 'Inter, sans-serif',
            'font-size': '10px',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'background-color': '#1f2937',
            'border-width': 2,
            'border-color': '#06b6d4',
            'width': 34,
            'height': 34,
          },
        },
        // Node Type Styling
        {
          selector: 'node[type = "actor"]',
          style: {
            'background-color': '#ef4444',
            'border-color': '#fca5a5',
            'width': 44,
            'height': 44,
          },
        },
        {
          selector: 'node[type = "alias"]',
          style: {
            'background-color': '#f97316',
            'border-color': '#fdba74',
            'width': 38,
            'height': 38,
          },
        },
        {
          selector: 'node[type = "pgp_key"]',
          style: {
            'background-color': '#06b6d4',
            'border-color': '#67e8f9',
          },
        },
        {
          selector: 'node[type = "wallet"], node[type = "btc_address"], node[type = "eth_address"], node[type = "xmr_address"]',
          style: {
            'background-color': '#eab308',
            'border-color': '#fef08a',
          },
        },
        {
          selector: 'node[type = "clearnet_account"]',
          style: {
            'background-color': '#22c55e',
            'border-color': '#86efac',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#374151',
            'target-arrow-color': '#06b6d4',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '8px',
            'color': '#9ca3af',
            'text-rotation': 'autorotate',
            'text-margin-y': -6,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#38bdf8',
            'border-width': 4,
            'border-opacity': 1.0,
          } as any,
        },
      ],
      layout: {
        name: layoutName,
        animate: true,
        animationDuration: 500,
        padding: 40,
      } as any,
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      if (onNodeClick) {
        onNodeClick(node.data());
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [elements, layoutName, onNodeClick]);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-[#0b0f19] rounded-lg border border-cyber-border overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
