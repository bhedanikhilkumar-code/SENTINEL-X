import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface StyleRadarProps {
  featuresA?: Record<string, any>;
  featuresB?: Record<string, any>;
  labelA?: string;
  labelB?: string;
}

export const StyleRadar: React.FC<StyleRadarProps> = ({
  featuresA = { mean_sentence_len: 22, type_token_ratio: 0.62, function_word_dist: { the: 12, of: 8, and: 6 } },
  featuresB,
  labelA = 'Darknet Corpus',
  labelB = 'Clearnet Candidate',
}) => {
  // Normalize key stylometric indicators into 0-100 radar dimensions
  const radarData = [
    {
      metric: 'Sentence Length',
      A: Math.min(100, (featuresA?.mean_sentence_len || 18) * 4),
      B: featuresB ? Math.min(100, (featuresB?.mean_sentence_len || 16) * 4) : undefined,
    },
    {
      metric: 'Vocabulary Richness',
      A: Math.round((featuresA?.type_token_ratio || 0.65) * 100),
      B: featuresB ? Math.round((featuresB?.type_token_ratio || 0.62) * 100) : undefined,
    },
    {
      metric: 'Function Word Density',
      A: Math.min(100, Object.keys(featuresA?.function_word_dist || {}).length * 4),
      B: featuresB ? Math.min(100, Object.keys(featuresB?.function_word_dist || {}).length * 4) : undefined,
    },
    {
      metric: 'Punctuation Variance',
      A: Math.min(100, ((featuresA?.punctuation?.comma || 4) + (featuresA?.punctuation?.semicolon || 1)) * 12),
      B: featuresB ? Math.min(100, ((featuresB?.punctuation?.comma || 3) + (featuresB?.punctuation?.semicolon || 1)) * 12) : undefined,
    },
    {
      metric: 'Oxford Comma Rate',
      A: Math.round((featuresA?.punctuation?.oxford_comma_rate || 0.75) * 100),
      B: featuresB ? Math.round((featuresB?.punctuation?.oxford_comma_rate || 0.80) * 100) : undefined,
    },
    {
      metric: 'Typo Signature Rate',
      A: Math.min(100, (featuresA?.typo_ngrams?.length || 2) * 25),
      B: featuresB ? Math.min(100, (featuresB?.typo_ngrams?.length || 2) * 25) : undefined,
    },
  ];

  return (
    <div className="w-full h-72 bg-[#111827] rounded-lg border border-cyber-border p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-semibold text-slate-200">
          Stylometric Feature Radar (Module C)
        </span>
        <div className="flex items-center space-x-3 text-[10px] font-mono">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm"></span>
            <span className="text-cyan-300">{labelA}</span>
          </span>
          {featuresB && (
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-red-400 rounded-sm"></span>
              <span className="text-red-300">{labelB}</span>
            </span>
          )}
        </div>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke="#1f2937" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#374151" tick={false} />
            <Radar name={labelA} dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
            {featuresB && (
              <Radar name={labelB} dataKey="B" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
            )}
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', color: '#f8fafc', fontSize: '11px', fontFamily: 'monospace' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
