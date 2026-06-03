import type React from 'react';

export const CHART_TOOLTIP = {
  backgroundColor: '#131c2e',
  border: '1px solid rgba(148,163,184,0.15)',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
  padding: '8px 12px',
};

// Required: Recharts ignores contentStyle.color for inner elements
export const CHART_TOOLTIP_ITEM: React.CSSProperties = {
  color: '#f1f5f9',
  fontWeight: 600,
};

export const CHART_TOOLTIP_LABEL: React.CSSProperties = {
  color: '#94a3b8',
  marginBottom: '4px',
  fontWeight: 500,
};

export const AXIS_TICK = { fontSize: 11, fill: '#64748b' };

export const GRID_STROKE = 'rgba(148,163,184,0.10)';

export const CHART_COLORS = {
  blue:    '#3b82f6',
  indigo:  '#6366f1',
  violet:  '#8b5cf6',
  cyan:    '#06b6d4',
  emerald: '#10b981',
  amber:   '#f59e0b',
  red:     '#f87171',
  slate:   '#64748b',
  sky:     '#0ea5e9',
  orange:  '#fb923c',
  zinc:    '#71717a',
};
