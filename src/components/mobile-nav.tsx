import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Button } from './ui/button'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from './theme-toggle'

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'Servizi', path: '/servizi' },
    { name: 'Punti', path: '/punti' },
    { name: 'Profilo', path: '/profilo' },
  ]

  const menuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    },
    open: {
      opacity: 1,
      x: "0%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    }
  }

  const handleNavigation = (path: string) => {
    setIsOpen(false)
    navigate(path)
  }

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="relative z-[70] text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay scuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu contenuto */}
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={menuVariants}
              className="fixed inset-y-0 right-0 z-[65] w-3/4 max-w-sm bg-white dark:bg-zinc-900 shadow-2xl flex flex-col"
            >
              {/* Header del menu */}
              <div className="flex-1 py-6 px-4 space-y-6 bg-white dark:bg-zinc-900">
                {menuItems.map((item) => (
                  <motion.div
                    key={item.path}
                    whileTap={{ scale: 0.95 }}
                    className="mb-4"
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-lg font-medium text-amber-900 hover:text-amber-700 
                               hover:bg-amber-50/80 dark:text-zinc-100 dark:hover:text-amber-300 
                               dark:hover:bg-zinc-800/80 py-4"
                      onClick={() => handleNavigation(item.path)}
                    >
                      {item.name}
                    </Button>
                  </motion.div>
                ))}
              </div>
              
              {/* Footer del menu */}
              <div className="p-4 border-t border-amber-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <ThemeToggle />
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false)
                    }}
                    className="border-2 border-amber-600 text-amber-700 hover:bg-amber-600 
                             hover:text-white dark:border-amber-500 dark:text-amber-400 
                             dark:hover:bg-amber-500 dark:hover:text-zinc-900
                             font-medium px-6 transition-all"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
