import { Search } from 'lucide-react';
import { Input } from './input';
import { Label } from './label';

interface SearchInputProps {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function SearchInput({
  valor,
  onChange,
  placeholder = 'Buscar...',
  label,
  className = '',
}: SearchInputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 hover:border-primary/50 focus:border-primary transition-all duration-200"
        />
      </div>
    </div>
  );
}