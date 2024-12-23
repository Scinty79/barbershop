type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry = this.createLogEntry(level, message, data);
    
    // Aggiungi al buffer interno
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Output in console con colori
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m'  // Red
    };

    const reset = '\x1b[0m';
    
    // Log del messaggio principale
    console.log(`${colors[level]}[${entry.timestamp}] ${level.toUpperCase()}: ${message}${reset}`);
    
    // Log dei dati aggiuntivi se presenti
    if (data) {
      console.log('Data:', data);
    }

    // Se è un errore, logga anche lo stack trace se disponibile
    if (level === 'error' && data?.stack) {
      console.error('Stack trace:', data.stack);
    }

    // Invia al server di logging se in produzione
    if (process.env.NODE_ENV === 'production') {
      this.sendToServer(entry);
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  private async sendToServer(entry: LogEntry) {
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        console.error('Failed to send log to server:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending log to server:', error);
    }
  }

  // Utility per ottenere tutti i log
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Utility per filtrare i log
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Utility per cercare nei log
  searchLogs(query: string): LogEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(log => 
      log.message.toLowerCase().includes(lowerQuery) ||
      JSON.stringify(log.data).toLowerCase().includes(lowerQuery)
    );
  }

  // Utility per esportare i log
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Utility per pulire i log
  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();
