import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Palette } from 'lucide-react';
import { useThemeStore, type Theme, type AccentColor } from '@/lib/theme/theme-service';
import { cn } from '@/lib/utils';

const themes: { label: string; value: Theme }[] = [
  { label: 'Chiaro', value: 'light' },
  { label: 'Scuro', value: 'dark' },
  { label: 'Sistema', value: 'system' },
];

const accentColors: { label: string; value: AccentColor }[] = [
  { label: 'Ambra', value: 'amber' },
  { label: 'Smeraldo', value: 'emerald' },
  { label: 'Viola', value: 'purple' },
  { label: 'Blu', value: 'blue' },
  { label: 'Rosa', value: 'rose' },
];

export function ThemeSettings() {
  const { theme, accentColor, setTheme, setAccentColor } = useThemeStore();

  const getAccentColorClass = (color: AccentColor) => {
    switch (color) {
      case 'amber':
        return 'bg-amber-500';
      case 'emerald':
        return 'bg-emerald-500';
      case 'purple':
        return 'bg-purple-500';
      case 'blue':
        return 'bg-blue-500';
      case 'rose':
        return 'bg-rose-500';
      default:
        return 'bg-amber-500';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Tema</DropdownMenuLabel>
        {themes.map(({ label, value }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'flex items-center justify-between',
              theme === value && 'bg-accent'
            )}
          >
            {label}
            {theme === value && (
              <div className="h-2 w-2 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Colore Accento</DropdownMenuLabel>
        {accentColors.map(({ label, value }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setAccentColor(value)}
            className="flex items-center justify-between"
          >
            <span>{label}</span>
            <div
              className={cn(
                'h-4 w-4 rounded-full',
                getAccentColorClass(value)
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
