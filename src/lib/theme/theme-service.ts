import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light' | 'system';
export type AccentColor = 'amber' | 'emerald' | 'purple' | 'blue' | 'rose';

interface ThemeState {
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      accentColor: 'amber',
      setTheme: (theme) => set({ theme }),
      setAccentColor: (color) => set({ accentColor }),
    }),
    {
      name: 'theme-storage',
    }
  )
);

export const getAccentColorClass = (color: AccentColor) => {
  switch (color) {
    case 'amber':
      return 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20';
    case 'emerald':
      return 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20';
    case 'purple':
      return 'text-purple-500 bg-purple-500/10 hover:bg-purple-500/20';
    case 'blue':
      return 'text-blue-500 bg-blue-500/10 hover:bg-blue-500/20';
    case 'rose':
      return 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20';
    default:
      return 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20';
  }
};
