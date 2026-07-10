import { useMemo } from 'react';
import type { Tracker, TrackerEntry, TrackerField } from '../types';

export interface FieldStats {
  field: TrackerField;
  total: number;
  average: number;
  min: number;
  max: number;
  count: number;
  values: number[];
  dates: string[];
}

export interface ChartDataPoint {
  date: string;
  label: string;
  value: number;
}

export interface SelectDistribution {
  option: string;
  count: number;
  percentage: number;
}

export interface BooleanDistribution {
  yes: number;
  no: number;
  yesPercentage: number;
}

export type DateRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

const filterEntriesByRange = (entries: TrackerEntry[], range: DateRange): TrackerEntry[] => {
  if (range === 'all') return entries;

  const now = new Date();
  const cutoff = new Date();

  switch (range) {
    case 'week':
      cutoff.setDate(now.getDate() - 7);
      break;
    case 'month':
      cutoff.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      cutoff.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      cutoff.setFullYear(now.getFullYear() - 1);
      break;
  }

  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return entries.filter(e => e.date >= cutoffStr);
};

export const useTrackerAnalytics = (
  tracker: Tracker,
  allEntries: TrackerEntry[],
  range: DateRange = 'all'
) => {
  const trackerEntries = useMemo(() => {
    const filtered = allEntries.filter(e => e.trackerId === tracker.id);
    return filterEntriesByRange(filtered, range).sort((a, b) => a.date.localeCompare(b.date));
  }, [allEntries, tracker.id, range]);

  // Compute stats for each numeric field
  const numericStats = useMemo((): FieldStats[] => {
    return tracker.fields
      .filter(f => f.type === 'number')
      .map(field => {
        const values: number[] = [];
        const dates: string[] = [];

        trackerEntries.forEach(entry => {
          const raw = entry.values[field.id];
          if (raw !== null && raw !== undefined && raw !== '') {
            const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
            if (!isNaN(num)) {
              values.push(num);
              dates.push(entry.date);
            }
          }
        });

        const total = values.reduce((acc, v) => acc + v, 0);
        const count = values.length;

        return {
          field,
          total,
          average: count > 0 ? total / count : 0,
          min: count > 0 ? Math.min(...values) : 0,
          max: count > 0 ? Math.max(...values) : 0,
          count,
          values,
          dates,
        };
      });
  }, [tracker.fields, trackerEntries]);

  // Generate line chart data for each numeric field
  const lineChartData = useMemo((): Record<string, ChartDataPoint[]> => {
    const result: Record<string, ChartDataPoint[]> = {};

    numericStats.forEach(stat => {
      result[stat.field.id] = stat.dates.map((date, i) => ({
        date,
        label: formatShortDate(date),
        value: stat.values[i],
      }));
    });

    return result;
  }, [numericStats]);

  // Distribution for select fields
  const selectDistributions = useMemo((): Record<string, SelectDistribution[]> => {
    const result: Record<string, SelectDistribution[]> = {};

    tracker.fields
      .filter(f => f.type === 'select')
      .forEach(field => {
        const counts: Record<string, number> = {};
        let total = 0;

        trackerEntries.forEach(entry => {
          const val = entry.values[field.id];
          if (val && typeof val === 'string') {
            counts[val] = (counts[val] || 0) + 1;
            total++;
          }
        });

        result[field.id] = Object.entries(counts).map(([option, count]) => ({
          option,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }));
      });

    return result;
  }, [tracker.fields, trackerEntries]);

  // Distribution for boolean fields
  const booleanDistributions = useMemo((): Record<string, BooleanDistribution> => {
    const result: Record<string, BooleanDistribution> = {};

    tracker.fields
      .filter(f => f.type === 'boolean')
      .forEach(field => {
        let yes = 0;
        let no = 0;

        trackerEntries.forEach(entry => {
          const val = entry.values[field.id];
          if (val === true) yes++;
          else if (val === false) no++;
        });

        const total = yes + no;
        result[field.id] = {
          yes,
          no,
          yesPercentage: total > 0 ? Math.round((yes / total) * 100) : 0,
        };
      });

    return result;
  }, [tracker.fields, trackerEntries]);

  // Trend detection for numeric fields (simple: is latest > average?)
  const trends = useMemo((): Record<string, 'up' | 'down' | 'stable'> => {
    const result: Record<string, 'up' | 'down' | 'stable'> = {};

    numericStats.forEach(stat => {
      if (stat.count < 2) {
        result[stat.field.id] = 'stable';
        return;
      }

      const lastThree = stat.values.slice(-3);
      const avg = lastThree.reduce((a, b) => a + b, 0) / lastThree.length;
      const overallAvg = stat.average;
      const diff = ((avg - overallAvg) / (overallAvg || 1)) * 100;

      if (diff > 5) result[stat.field.id] = 'up';
      else if (diff < -5) result[stat.field.id] = 'down';
      else result[stat.field.id] = 'stable';
    });

    return result;
  }, [numericStats]);

  return {
    trackerEntries,
    numericStats,
    lineChartData,
    selectDistributions,
    booleanDistributions,
    trends,
    entryCount: trackerEntries.length,
  };
};

// Helper
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
