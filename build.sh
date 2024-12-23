#!/bin/bash

# Pulisci la cache di npm
echo "Cleaning npm cache..."
npm cache clean --force

# Installa le dipendenze
echo "Installing dependencies..."
npm install

# Aggiungi node_modules/.bin al PATH
export PATH="$PATH:$(pwd)/node_modules/.bin"

# Build del progetto
echo "Building project..."
npm run build:full
