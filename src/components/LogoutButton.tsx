import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // 1. Effettuiamo il logout
      await logout();

      // 2. Navighiamo alla home
      navigate('/', { 
        replace: true,
        state: { fromLogout: true } 
      });

      // 3. Mostriamo il toast di logout dopo un breve delay
      setTimeout(() => {
        toast({
          title: "Arrivederci!",
          description: "Logout effettuato con successo",
          duration: 3000,
        });
      }, 100);
      
    } catch (error) {
      console.error('Errore durante il logout:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il logout",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <Button 
      onClick={handleLogout}
      variant="ghost" 
      className="text-zinc-200 hover:text-white hover:bg-zinc-800"
    >
      <LogOut className="h-5 w-5 mr-2" />
      Logout
    </Button>
  );
}
