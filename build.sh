#!/bin/bash

# Pulisci la cache di npm
echo "Cleaning npm cache..."
npm cache clean --force

# Rimuovi node_modules se esiste
echo "Removing node_modules..."
rm -rf node_modules

# Installa tutte le dipendenze
echo "Installing dependencies..."
NODE_ENV=development npm install

# Genera il client Prisma
echo "Generating Prisma client..."
npx prisma generate

# Build del frontend
echo "Building frontend..."
NODE_ENV=production npx tsc
NODE_ENV=production npx vite build

# Build del backend
echo "Building backend..."
NODE_ENV=production npx tsc -p tsconfig.server.json
