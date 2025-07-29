# Automatisches Deployment zu IONOS

## Setup für automatisches Deployment

### 1. GitHub Repository erstellen
```bash
# Aktuelles Repository zu GitHub pushen
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DEIN_USERNAME/DEIN_REPO.git
git push -u origin main
```

### 2. GitHub Secrets konfigurieren
Gehe zu deinem GitHub Repository → Settings → Secrets and variables → Actions

Füge folgende Secrets hinzu:
- `FTP_SERVER`: Dein IONOS FTP Server (z.B. `ftp.deine-domain.de`)
- `FTP_USERNAME`: Dein IONOS FTP Benutzername
- `FTP_PASSWORD`: Dein IONOS FTP Passwort

### 3. IONOS Server vorbereiten
- Stelle sicher, dass dein IONOS Hosting-Paket FTP-Zugriff unterstützt
- Erstelle einen `public_html` Ordner auf deinem Server (falls nicht vorhanden)

### 4. Automatisches Deployment
Nach dem Setup wird bei jedem Push auf den `main` Branch automatisch:
1. Das Projekt gebaut (`npm run build`)
2. Die Dateien per FTP auf deinen IONOS Server hochgeladen

### 5. Manuelles Deployment
Du kannst auch manuell deployen:
- Gehe zu GitHub → Actions → Deploy to IONOS → Run workflow

## Alternative: Lokales Deployment
```bash
# Projekt bauen
npm run build

# Dateien manuell per FTP hochladen
# Der dist/ Ordner enthält alle Dateien für den Server
```

## Troubleshooting
- Stelle sicher, dass deine IONOS FTP-Zugangsdaten korrekt sind
- Überprüfe, ob der `public_html` Ordner auf deinem Server existiert
- Bei Problemen: GitHub Actions Logs überprüfen 