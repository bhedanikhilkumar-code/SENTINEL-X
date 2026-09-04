import React, { useState } from 'react';
import { Archive, Search, Filter } from 'lucide-react';
import { ArtifactCard } from './ArtifactCard';

interface EvidenceLockerProps {
  artifacts?: Array<{
    id: string;
    type: string;
    value: string;
    confidence?: number;
    doc_hash?: string;
  }>;
}

export const EvidenceLocker: React.FC<EvidenceLockerProps> = ({
  artifacts = [
    { id: 'art-1', type: 'pgp_key', value: '4A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B', confidence: 0.95, doc_hash: '3a1f4b...' },
    { id: 'art-2', type: 'btc_address', value: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', confidence: 0.90, doc_hash: '7b2e9c...' },
    { id: 'art-3', type: 'ssh_key', value: 'SHA256:4t7XmK9pL2vNqW8zR1yB6uE5iO0sA3dF7gH', confidence: 0.88, doc_hash: '9f0a2d...' },
    { id: 'art-4', type: 'email', value: 'vsharma.dev@protonmail.com', confidence: 0.92, doc_hash: '4d8c1e...' },
  ],
}) => {
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = artifacts.filter((a) => {
    const matchesType = filterType === 'all' || a.type.includes(filterType);
    const matchesSearch = !search || a.value.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="bg-[#111827] rounded-lg border border-cyber-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <Archive className="w-5 h-5 text-cyan-400" />
          <h3 className="font-mono font-bold text-white text-sm">
            Digital Evidence Locker (Module B)
          </h3>
          <span className="text-xs font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
            {artifacts.length} Extracted Exhibits
          </span>
        </div>

        {/* Filter Badges & Search */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search artifacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0b0f19] border border-cyber-border rounded pl-8 pr-3 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0b0f19] border border-cyber-border rounded px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Exhibits</option>
            <option value="pgp">PGP Keys</option>
            <option value="address">Crypto Wallets</option>
            <option value="ssh">SSH Keys</option>
            <option value="email">Email Addresses</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
        {filtered.map((art) => (
          <ArtifactCard key={art.id} artifact={art} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-8 text-xs font-mono text-slate-500">
            No artifacts matching current filter.
          </div>
        )}
      </div>
    </div>
  );
};
