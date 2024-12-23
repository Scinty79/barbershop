#!/bin/bash

# Pulisci la cache di npm
echo "Cleaning npm cache..."
npm cache clean --force

# Installa le dipendenze
echo "Installing dependencies..."
npm install

# Build del progetto
echo "Building project..."
npm run build:full
