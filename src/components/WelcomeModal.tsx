import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

export function WelcomeModal({ isOpen, onClose, userRole }: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Benvenuto!</DialogTitle>
          <DialogDescription>
            {userRole === 'CLIENTE' 
              ? 'Accesso effettuato con successo! Stai per essere reindirizzato alla tua dashboard...'
              : 'Accesso amministratore effettuato con successo! Stai per essere reindirizzato...'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center p-4">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
