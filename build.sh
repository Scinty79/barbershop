#!/bin/bash

# Pulisci la cache di npm
echo "Cleaning npm cache..."
npm cache clean --force

# Rimuovi node_modules se esiste
echo "Removing node_modules..."
rm -rf node_modules

# Installa tutte le dipendenze
echo "Installing dependencies..."
npm install

# Installa vite e typescript globalmente
echo "Installing global dependencies..."
npm install -g vite typescript @vitejs/plugin-react

# Build del frontend
echo "Building frontend..."
npx tsc
npx vite build

# Build del backend
echo "Building backend..."
npx tsc -p tsconfig.server.json
