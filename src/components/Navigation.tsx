import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { MobileNav } from './mobile-nav';
import { LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  onAuthClick?: (type: 'login' | 'register' | 'reset-password') => void;
}

export function Navigation({ onAuthClick }: NavigationProps) {
  const path = useLocation().pathname;

  const scrollToServices = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const servicesSection = document.getElementById('servizi');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAuthClick = () => {
    onAuthClick?.('login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-50 to-amber-100/90 dark:from-zinc-950 dark:to-zinc-900 
                   backdrop-blur-md shadow-lg border-b border-amber-200/20 dark:border-zinc-800/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors">
            Barbershop
          </Link>

          {/* Navigation Links - Centered */}
          <div className="flex-1 flex justify-center">
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={cn(
                  'text-sm uppercase tracking-wide font-medium transition-colors hover:text-amber-700 dark:hover:text-amber-300',
                  path === '/' ? 'text-amber-700 dark:text-amber-300' : 'text-amber-900 dark:text-zinc-400'
                )}
              >
                Home
              </Link>
              <a
                href="#servizi"
                onClick={scrollToServices}
                className="text-sm uppercase tracking-wide font-medium transition-colors hover:text-amber-700 dark:hover:text-amber-300
                         text-amber-900 dark:text-zinc-400"
              >
                Servizi
              </a>
            </div>
          </div>

          {/* Right Side - Theme Toggle & Auth Buttons */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="hidden md:flex items-center">
              <Button
                variant="outline"
                onClick={handleAuthClick}
                className="border-2 border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white
                         dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-500 dark:hover:text-zinc-900
                         font-medium px-6 transition-all"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Accedi
              </Button>
            </div>
            <MobileNav />
          </div>
        </div>
      </div>
    </nav>
  );
}