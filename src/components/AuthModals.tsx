import { useState, useEffect } from 'react';
import { RegisterForm } from './RegisterForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { LoginForm } from './LoginForm';
import { ResetPasswordForm } from './ResetPasswordForm';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface AuthModalsProps {
  showModal: 'login' | 'register' | 'reset-password' | null;
  onClose: () => void;
  onChangeModal: (modal: 'login' | 'register' | 'reset-password') => void;
}

export default function AuthModals({ showModal, onClose, onChangeModal }: AuthModalsProps) {
  const handleClose = () => {
    onClose();
  };

  return (
    <>
      {/* Login Modal */}
      {showModal === 'login' && (
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accedi</DialogTitle>
              <DialogDescription>
                Inserisci le tue credenziali per accedere
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <LoginForm 
                onSuccess={handleClose} 
                onChangeModal={onChangeModal} 
              />
              
              <div className="space-y-2 text-center">
                <button
                  onClick={() => onChangeModal('reset-password')}
                  className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
                >
                  Password dimenticata?
                </button>
                
                <div className="text-sm text-zinc-400">
                  Non hai un account?{' '}
                  <button
                    onClick={() => onChangeModal('register')}
                    className="text-amber-500 hover:text-amber-400 transition-colors font-medium"
                  >
                    Registrati
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Register Modal */}
      {showModal === 'register' && (
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrati</DialogTitle>
              <DialogDescription>
                Crea un account per accedere ai nostri servizi
              </DialogDescription>
            </DialogHeader>
            <RegisterForm 
              onSuccess={() => {
                onChangeModal('welcome');
              }} 
            />
            <div className="text-sm text-center text-zinc-400">
              Hai già un account?{' '}
              <button
                onClick={() => onChangeModal('login')}
                className="text-amber-500 hover:text-amber-400 transition-colors font-medium"
              >
                Accedi
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reset Password Modal */}
      {showModal === 'reset-password' && (
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recupera Password</DialogTitle>
              <DialogDescription>
                Inserisci la tua email per recuperare la password
              </DialogDescription>
            </DialogHeader>
            <ResetPasswordForm 
              onSuccess={handleClose} 
              onChangeModal={onChangeModal}
            />
            <div className="text-sm text-center text-zinc-400">
              Ricordi la password?{' '}
              <button
                onClick={() => onChangeModal('login')}
                className="text-amber-500 hover:text-amber-400 transition-colors font-medium"
              >
                Accedi
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Welcome Modal */}
      {showModal === 'welcome' && (
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Benvenuto!</DialogTitle>
              <DialogDescription>
                Accesso effettuato con successo! Stai per essere reindirizzato alla tua dashboard...
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}