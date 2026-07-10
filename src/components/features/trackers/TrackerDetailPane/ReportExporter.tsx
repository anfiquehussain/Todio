import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import type { Tracker, TrackerEntry } from '../../../../types';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../../hooks/useToast';

interface ReportExporterProps {
  tracker: Tracker;
  entries: TrackerEntry[];
}

export const ReportExporter = ({ tracker, entries }: ReportExporterProps) => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const filteredEntries = entries
    .filter(e => e.trackerId === tracker.id && e.date >= startDate && e.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));

  const handleExportCSV = () => {
    if (filteredEntries.length === 0) {
      toast('No data available in selected range.', 'warning');
      return;
    }

    // Header definition
    const headers = ['Date', 'Note', ...tracker.fields.map(f => f.name)];
    
    // Rows building
    const rows = filteredEntries.map(entry => {
      const fieldValues = tracker.fields.map(field => {
        const val = entry.values[field.id];
        if (val === null || val === undefined) return '';
        if (field.type === 'boolean') return val ? 'Yes' : 'No';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      return [entry.date, `"${(entry.note || '').replace(/"/g, '""')}"`, ...fieldValues];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${tracker.name.toLowerCase().replace(/\s+/g, '_')}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Report exported successfully!', 'success');
  };

  const handleExportJSON = () => {
    if (filteredEntries.length === 0) {
      toast('No data available in selected range.', 'warning');
      return;
    }

    const payload = {
      tracker: {
        id: tracker.id,
        name: tracker.name,
        category: tracker.category,
        fields: tracker.fields.map(f => ({ id: f.id, name: f.name, type: f.type, unit: f.unit }))
      },
      entries: filteredEntries.map(entry => ({
        id: entry.id,
        date: entry.date,
        note: entry.note,
        values: entry.values
      }))
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${tracker.name.toLowerCase().replace(/\s+/g, '_')}_report.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('JSON Report exported successfully!', 'success');
  };

  return (
    <div className="p-4 rounded-2xl border border-gray-border/20 bg-card/30 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-brand-primary" />
        <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider">Export Custom Reports</h5>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[10px] font-bold text-text-secondary/60 uppercase">Start Date</label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-border/40 bg-bg-secondary text-text-primary text-xs font-semibold focus:outline-hidden focus:border-brand-primary"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[10px] font-bold text-text-secondary/60 uppercase">End Date</label>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-border/40 bg-bg-secondary text-text-primary text-xs font-semibold focus:outline-hidden focus:border-brand-primary"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Button
          onClick={handleExportCSV}
          variant="primary"
          size="sm"
          className="flex-1 flex items-center justify-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </Button>
        <Button
          onClick={handleExportJSON}
          variant="ghost"
          size="sm"
          className="flex-1 flex items-center justify-center gap-1.5 border border-gray-border/40"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Export JSON</span>
        </Button>
      </div>
    </div>
  );
};
