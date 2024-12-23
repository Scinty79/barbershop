#!/bin/bash

# Installa le dipendenze di sviluppo
echo "Installing dependencies..."
npm ci

# Installa vite globalmente
echo "Installing vite globally..."
npm install -g vite

# Installa typescript globalmente
echo "Installing typescript globally..."
npm install -g typescript

# Installa Prisma globalmente
echo "Installing Prisma globally..."
npm install -g prisma

# Installa @prisma/client
echo "Installing @prisma/client..."
npm install @prisma/client

# Genera il client Prisma
echo "Generating Prisma client..."
npx prisma generate

# Build del progetto
echo "Building project..."
npm run build:full
