import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Hash, Calculator, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAppSelector } from '../../../../hooks/useRedux';
import { useTrackerAnalytics } from '../../../../hooks/useTrackerAnalytics';
import type { DateRange } from '../../../../hooks/useTrackerAnalytics';
import type { Tracker } from '../../../../types';
import { ReportExporter } from './ReportExporter';

interface AnalyticsPanelProps {
  tracker: Tracker;
}

// SVG Line Chart component
const LineChart = ({ data, color }: { data: { label: string; value: number }[]; color: string }) => {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-text-secondary/50 font-medium">
        Need at least 2 data points for chart
      </div>
    );
  }

  const width = 320;
  const height = 140;
  const padding = { top: 10, right: 10, bottom: 25, left: 40 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - ((d.value - minVal) / range) * chartH,
    label: d.label,
    value: d.value,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Area fill path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  // Y-axis labels (3 ticks)
  const yTicks = [minVal, (minVal + maxVal) / 2, maxVal];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {yTicks.map((tick, i) => {
        const y = padding.top + chartH - ((tick - minVal) / range) * chartH;
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={padding.left - 5} y={y + 3} textAnchor="end" className="fill-text-secondary/40" fontSize="8" fontWeight="600">
              {tick % 1 === 0 ? tick : tick.toFixed(1)}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <path d={areaD} fill={`${color}10`} />

      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="rgba(0,0,0,0.3)" strokeWidth="1">
          <title>{`${p.label}: ${p.value}`}</title>
        </circle>
      ))}

      {/* X-axis labels (show first, middle, last) */}
      {[0, Math.floor(data.length / 2), data.length - 1].map((idx) => {
        if (idx >= points.length) return null;
        const p = points[idx];
        return (
          <text key={idx} x={p.x} y={height - 3} textAnchor="middle" className="fill-text-secondary/40" fontSize="7" fontWeight="600">
            {p.label}
          </text>
        );
      })}
    </svg>
  );
};

// SVG Bar Chart component
const BarChart = ({ data, color }: { data: { label: string; value: number }[]; color: string }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-text-secondary/50 font-medium">
        No data available
      </div>
    );
  }

  const width = 320;
  const height = 140;
  const padding = { top: 10, right: 10, bottom: 25, left: 40 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 1);

  const barWidth = Math.min(25, (chartW / data.length) * 0.6);
  const gap = (chartW - barWidth * data.length) / (data.length + 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Bars */}
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH;
        const x = padding.left + gap * (i + 1) + barWidth * i;
        const y = padding.top + chartH - barH;

        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} rx="3" fill={color} opacity="0.8">
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
            <text x={x + barWidth / 2} y={height - 3} textAnchor="middle" className="fill-text-secondary/40" fontSize="7" fontWeight="600">
              {d.label.length > 5 ? d.label.slice(0, 5) : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// SVG Pie Chart component
const PieChart = ({ data, colors }: { data: { label: string; value: number }[]; colors: string[] }) => {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-text-secondary/50 font-medium">
        No data available
      </div>
    );
  }

  const size = 120;
  const center = size / 2;
  const radius = 45;
  let currentAngle = -90; // Start from top

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const pathD = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return {
      path: pathD,
      color: colors[i % colors.length],
      label: d.label,
      percentage: Math.round((d.value / total) * 100),
    };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-28 h-28 shrink-0">
        {slices.map((slice, i) => (
          <path key={i} d={slice.path} fill={slice.color} opacity="0.85" stroke="rgba(0,0,0,0.2)" strokeWidth="1">
            <title>{`${slice.label}: ${slice.percentage}%`}</title>
          </path>
        ))}
        {/* Center hole for donut effect */}
        <circle cx={center} cy={center} r="20" fill="var(--color-bg-primary)" />
      </svg>
      <div className="flex flex-col gap-1.5">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
            <span className="text-[10px] font-semibold text-text-secondary">{slice.label}</span>
            <span className="text-[10px] font-bold text-text-primary tabular-nums">{slice.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PIE_COLORS = ['#c2883c', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#0ea5e9'];

export const AnalyticsPanel = ({ tracker }: AnalyticsPanelProps) => {
  const { entries } = useAppSelector((state) => state.tracker);
  const [range, setRange] = useState<DateRange>('all');

  const {
    numericStats,
    lineChartData,
    selectDistributions,
    booleanDistributions,
    trends,
    entryCount,
  } = useTrackerAnalytics(tracker, entries, range);

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-success" />;
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-error" />;
    return <Minus className="w-3.5 h-3.5 text-text-secondary/50" />;
  };

  if (entryCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none">
        <div className="p-4 bg-[#1a1a1a] border border-gray-border/30 rounded-3xl mb-4">
          <Calculator className="w-10 h-10 text-text-secondary/15" />
        </div>
        <h4 className="text-sm font-bold text-text-primary mb-1">No data to analyze</h4>
        <p className="text-xs text-text-secondary/60 font-medium max-w-xs">
          Add entries to this tracker to see charts, statistics, and trend insights.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 pb-6 space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center gap-1.5 pt-3 shrink-0 overflow-x-auto no-scrollbar">
        {(['week', 'month', 'quarter', 'year', 'all'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize cursor-pointer transition-all border shrink-0 ${
              range === r
                ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                : 'bg-transparent text-text-secondary border-transparent hover:text-text-primary hover:bg-card/40'
            }`}
          >
            {r === 'all' ? 'All Time' : r === 'quarter' ? '3 Months' : r}
          </button>
        ))}
      </div>

      {/* Summary Stats Cards */}
      <div className="flex flex-col gap-2">
        <h5 className="text-[11px] font-bold text-text-secondary/50 uppercase tracking-wider">
          Summary
        </h5>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-border/20 bg-card/30">
            <div className="p-2 rounded-lg bg-brand-primary/10">
              <Hash className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-text-primary tabular-nums">{entryCount}</span>
              <span className="text-[10px] font-semibold text-text-secondary/60">Total Entries</span>
            </div>
          </div>

          {numericStats.slice(0, 3).map(stat => (
            <div key={stat.field.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-border/20 bg-card/30">
              <div className="p-2 rounded-lg" style={{ backgroundColor: tracker.color + '15' }}>
                {trends[stat.field.id] === 'up'
                  ? <ArrowUpRight className="w-4 h-4" style={{ color: tracker.color }} />
                  : <ArrowDownRight className="w-4 h-4" style={{ color: tracker.color }} />
                }
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-extrabold text-text-primary tabular-nums truncate">
                  {stat.average % 1 === 0 ? stat.average : stat.average.toFixed(1)}
                  {stat.field.unit && <span className="text-xs font-semibold text-text-secondary/50 ml-0.5">{stat.field.unit}</span>}
                </span>
                <span className="text-[10px] font-semibold text-text-secondary/60 truncate">
                  Avg {stat.field.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Numeric Field Stats + Charts */}
      {numericStats.map(stat => (
        <div key={stat.field.id} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h5 className="text-[11px] font-bold text-text-secondary/50 uppercase tracking-wider">
              {stat.field.name}
            </h5>
            <TrendIcon trend={trends[stat.field.id]} />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total', value: stat.total },
              { label: 'Average', value: stat.average },
              { label: 'Highest', value: stat.max },
              { label: 'Lowest', value: stat.min },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center p-2.5 rounded-xl border border-gray-border/15 bg-card/20">
                <span className="text-sm font-extrabold text-text-primary tabular-nums">
                  {value % 1 === 0 ? value : value.toFixed(1)}
                </span>
                <span className="text-[9px] font-semibold text-text-secondary/50 uppercase tracking-wide mt-0.5">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Line Chart */}
          {lineChartData[stat.field.id] && lineChartData[stat.field.id].length >= 2 && (
            <div className="p-3 rounded-xl border border-gray-border/15 bg-card/20">
              <p className="text-[10px] font-semibold text-text-secondary/50 mb-2">Trend Over Time</p>
              <LineChart data={lineChartData[stat.field.id]} color={tracker.color} />
            </div>
          )}

          {/* Bar Chart */}
          {lineChartData[stat.field.id] && lineChartData[stat.field.id].length >= 1 && (
            <div className="p-3 rounded-xl border border-gray-border/15 bg-card/20">
              <p className="text-[10px] font-semibold text-text-secondary/50 mb-2">Values Comparison</p>
              <BarChart data={lineChartData[stat.field.id].slice(-10)} color={tracker.color} />
            </div>
          )}
        </div>
      ))}

      {/* Select Field Distributions */}
      {tracker.fields
        .filter(f => f.type === 'select')
        .map(field => {
          const dist = selectDistributions[field.id];
          if (!dist || dist.length === 0) return null;

          return (
            <div key={field.id} className="flex flex-col gap-3">
              <h5 className="text-[11px] font-bold text-text-secondary/50 uppercase tracking-wider">
                {field.name} Distribution
              </h5>
              <div className="p-3 rounded-xl border border-gray-border/15 bg-card/20">
                <PieChart
                  data={dist.map(d => ({ label: d.option, value: d.count }))}
                  colors={PIE_COLORS}
                />
              </div>
            </div>
          );
        })}

      {/* Boolean Field Distributions */}
      {tracker.fields
        .filter(f => f.type === 'boolean')
        .map(field => {
          const dist = booleanDistributions[field.id];
          if (!dist) return null;

          return (
            <div key={field.id} className="flex flex-col gap-3">
              <h5 className="text-[11px] font-bold text-text-secondary/50 uppercase tracking-wider">
                {field.name}
              </h5>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-border/15 bg-card/20">
                {/* Progress bar style */}
                <div className="flex-1 h-6 rounded-full bg-gray-border/20 overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${dist.yesPercentage}%`,
                      backgroundColor: tracker.color,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="text-[10px] font-bold text-white">Yes: {dist.yes}</span>
                    <span className="text-[10px] font-bold text-text-secondary">No: {dist.no}</span>
                  </div>
                </div>
                <span className="text-sm font-extrabold tabular-nums" style={{ color: tracker.color }}>
                  {dist.yesPercentage}%
                </span>
              </div>
            </div>
          );
        })}

      {/* Exporter Section */}
      <ReportExporter tracker={tracker} entries={entries} />
    </div>
  );
};
