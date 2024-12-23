import { ArrowUp } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed bottom-8 right-8 z-50 rounded-full p-2 bg-amber-100 hover:bg-amber-200 
                 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-2 border-amber-300 dark:border-amber-700"
      onClick={scrollToTop}
    >
      <ArrowUp className="h-5 w-5 text-amber-700 dark:text-amber-300" />
    </Button>
  );
}
