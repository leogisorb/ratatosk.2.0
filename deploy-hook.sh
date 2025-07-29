#!/bin/bash

# Deployment Script für IONOS VPS
# Dieses Script wird automatisch ausgeführt, wenn Code gepusht wird

echo "🚀 Starting deployment..."

# In das Projektverzeichnis wechseln
cd /var/www/html/ratatosk

# Aktuelle Änderungen holen
git pull origin main

# Dependencies installieren
npm install

# Projekt bauen
npm run build

# Berechtigungen setzen
chmod -R 755 dist/

echo "✅ Deployment completed!" 