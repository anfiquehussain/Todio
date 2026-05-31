import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search tasks…',
}: SearchBarProps) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary/50">
        <Search aria-hidden="true" className="w-4.5 h-4.5" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-gray-border bg-card text-text-primary text-sm transition-colors placeholder:text-text-secondary/40 focus:outline-hidden focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 font-sans"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary/40 hover:text-text-primary transition-colors cursor-pointer"
        >
          <X aria-hidden="true" className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

