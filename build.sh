#!/bin/bash

# Installa le dipendenze
echo "Installing dependencies..."
npm ci

# Installa Prisma globalmente
echo "Installing Prisma globally..."
npm install -g prisma

# Genera il client Prisma
echo "Generating Prisma client..."
npx prisma generate

# Build del progetto
echo "Building project..."
npm run build:full
