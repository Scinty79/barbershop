const login = async (credentials: LoginCredentials) => {
  try {
    const response = await loginUser(credentials);
    if (response.token) {
      setAuthState({
        token: response.token,
        user: response.user,
        isAuthenticated: true,
      });
      // Salva il token nel localStorage o in un cookie sicuro
      localStorage.setItem('authToken', response.token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Errore durante il login:', error);
    throw new Error('Errore durante il login');
  }
}; 