import React, { useState } from 'react';
import { X, Plus, Shield } from 'lucide-react';
import { api } from '../../config/api';

interface CaseCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CaseCreate: React.FC<CaseCreateProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await api.post('/api/cases', {
        title,
        description,
      });
      setTitle('');
      setDescription('');
      onCreated();
      onClose();
    } catch {
      // offline fallback
      onCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#111827] border border-cyber-border rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-cyber-border">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono font-bold text-white text-base">
              Open New Threat Actor Case
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-mono text-cyan-300 mb-1.5">
              Operation / Target Codename
            </label>
            <input
              type="text"
              required
              placeholder="e.g. OPERATION PHANTOM-KRYPT"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0b0f19] border border-cyber-border rounded px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-cyan-300 mb-1.5">
              Preliminary Intelligence Summary
            </label>
            <textarea
              rows={3}
              placeholder="Initial target handles, darknet forum urls, ransom demands..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0b0f19] border border-cyber-border rounded p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-cyber-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs shadow-glow-cyan transition-colors"
            >
              {loading ? 'Initializing Case...' : 'Create Investigation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
