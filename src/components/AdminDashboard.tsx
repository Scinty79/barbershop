// Per favore mostra il contenuto di questo file 

import { ServiceDialog, type Service, type ServiceCategory, ServiceCategories } from './ServiceDialog';

const formattaGenereUtente = (utente: any) => {
  const genereOriginale = utente.genere || '';
  const genereNormalizzato = genereOriginale.toUpperCase() === 'M' ? 'M' : 
                            genereOriginale.toUpperCase() === 'F' ? 'F' : '';
  return {
    genereOriginale,
    genereNormalizzato,
    tipo: typeof genereOriginale
  };
};

const handleUpdateService = async () => {
  if (!editedService) return;

  try {
    setIsLoading(true);
    
    // Validazione e conversione dei dati
    const durata = parseInt(editedService.durata.toString());
    let prezzo = editedService.prezzo;
    
    // Se il prezzo è una stringa, convertiamolo in numero
    if (typeof prezzo === 'string') {
      prezzo = parseFloat(prezzo);
    }

    if (isNaN(durata) || isNaN(prezzo)) {
      toast.error('Il prezzo e la durata devono essere numeri validi');
      return;
    }

    // Prepara i dati da inviare
    const serviceData = {
      nome: editedService.nome.trim(),
      descrizione: editedService.descrizione.trim(),
      durata: durata,
      prezzo: Number(prezzo.toFixed(2)),
      categoria: editedService.categoria.trim().toUpperCase()
    };

    console.log('Invio dati aggiornamento:', serviceData);

    const response = await axios.put(
      `/api/services/${editedService.id}`,
      serviceData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      toast.success('Servizio aggiornato con successo!');
      // Aggiorna la lista dei servizi con i nuovi dati
      setServices(prevServices =>
        prevServices.map(service =>
          service.id === editedService.id
            ? { ...service, ...response.data.data }
            : service
        )
      );
      setShowEditModal(false);
    }
  } catch (error: any) {
    console.error('Errore durante l\'aggiornamento:', error);
    const errorMessage = error.response?.data?.error || 'Errore durante l\'aggiornamento del servizio';
    console.error('Dettagli errore:', error.response?.data?.details);
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

const handleAddService = async (serviceData: Service) => {
  try {
    // Validazione dei dati prima dell'invio
    if (!serviceData.nome || !serviceData.descrizione || !serviceData.categoria) {
      toast.error('Tutti i campi sono obbligatori');
      return;
    }

    if (serviceData.descrizione.length < 10) {
      toast.error('La descrizione deve essere di almeno 10 caratteri');
      return;
    }

    if (serviceData.prezzo < 0.5) {
      toast.error('Il prezzo minimo è di 0.50€');
      return;
    }

    // Prepara i dati per l'invio
    const normalizedData = {
      ...serviceData,
      nome: serviceData.nome.trim(),
      descrizione: serviceData.descrizione.trim(),
      prezzo: Number(serviceData.prezzo.toFixed(2)),
      durata: Math.round(serviceData.durata / 5) * 5,
      categoria: serviceData.categoria.trim().toUpperCase()
    };

    console.log('Dati inviati all\'API:', normalizedData);
    
    const response = await api.post('/api/services', normalizedData);
    
    if (response.data.success) {
      toast.success('Servizio aggiunto con successo!');
      // Aggiorna la lista dei servizi con i nuovi dati
      setServices(prevServices => [...prevServices, response.data.data]);
      setShowAddModal(false);
    }
  } catch (error: any) {
    console.error('Errore durante l\'aggiunta del servizio:', error);
    const errorMessage = error.response?.data?.error || 'Errore durante l\'aggiunta del servizio';
    toast.error(errorMessage);
  }
};

const handleSaveBarber = async (userData: any) => {
  try {
    console.log('Inizio processo di salvataggio barbiere:', userData);
    
    // Prepara i dati per l'aggiornamento dell'utente
    const userUpdateData = {
      id: userData.id,
      nome: userData.nome,
      cognome: userData.cognome,
      email: userData.email,
      telefono: userData.telefono || '',
      ruolo: 'BARBIERE',
      genere: userData.genere || 'M'  // Aggiungiamo un valore di default per il genere
    };
    
    console.log('Dati aggiornamento utente:', userUpdateData);
    
    // Prima aggiorniamo il ruolo dell'utente
    const updateUserResponse = await axios.put(`${API_URL}/users/${userData.id}`, userUpdateData);
    console.log('Risposta aggiornamento utente:', updateUserResponse.data);
    
    if (updateUserResponse.data.success) {
      // Ora creiamo il record del barbiere
      const barberData = {
        utenteId: userData.id,
        specialita: 'Generale',  // Valore di default
        descrizione: userData.descrizione || 'Nuovo barbiere',
        orariLavoro: [
          { giorno: 'LUNEDI', oraInizio: '09:00', oraFine: '18:00' },
          { giorno: 'MARTEDI', oraInizio: '09:00', oraFine: '18:00' },
          { giorno: 'MERCOLEDI', oraInizio: '09:00', oraFine: '18:00' },
          { giorno: 'GIOVEDI', oraInizio: '09:00', oraFine: '18:00' },
          { giorno: 'VENERDI', oraInizio: '09:00', oraFine: '18:00' }
        ]
      };
      
      console.log('Creazione record barbiere con dati:', barberData);
      
      try {
        const barberResponse = await axios.post(`${API_URL}/admin/barbers`, barberData);
        console.log('Risposta creazione barbiere:', barberResponse.data);
        
        if (barberResponse.data.success) {
          console.log('Barbiere creato con successo');
          toast.success('Utente promosso a barbiere con successo');
          setShowSuccessMessage(true);
          loadUsers(); // Ricarica la lista utenti
        } else {
          throw new Error(barberResponse.data.error || 'Errore nella creazione del barbiere');
        }
      } catch (barberError: any) {
        console.error('Errore nella creazione del barbiere:', barberError);
        // Ripristina il ruolo utente in caso di errore
        await axios.put(`${API_URL}/users/${userData.id}`, { ...userUpdateData, ruolo: 'CLIENTE' });
        throw new Error(barberError.response?.data?.error || 'Errore nella creazione del barbiere');
      }
    } else {
      throw new Error(updateUserResponse.data.error || 'Errore nell\'aggiornamento del ruolo utente');
    }
  } catch (error: any) {
    console.error('Errore dettagliato:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    
    const errorMessage = error.response?.data?.error || error.message || 'Errore durante il salvataggio delle modifiche';
    toast.error(errorMessage);
    setError(errorMessage);
  }
};