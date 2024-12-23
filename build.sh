#!/bin/bash

# Pulisci la cache di npm
echo "Cleaning npm cache..."
npm cache clean --force

# Installa vite globalmente prima di tutto
echo "Installing vite globally..."
npm install -g vite

# Installa le dipendenze di sviluppo prima
echo "Installing dev dependencies..."
npm install --only=dev

# Installa le dipendenze di produzione
echo "Installing production dependencies..."
npm install --only=prod

# Genera il client Prisma
echo "Generating Prisma client..."
npx prisma generate

# Build del progetto
echo "Building project..."
npm run build:full
