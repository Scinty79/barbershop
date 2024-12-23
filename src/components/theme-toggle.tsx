import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative h-9 w-9 rounded-md border border-amber-200/20 bg-amber-50/10 hover:bg-amber-100/20 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-700/50"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 text-amber-600 transition-transform dark:rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 text-amber-400 transition-transform dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Cambia tema</span>
    </Button>
  )
}
