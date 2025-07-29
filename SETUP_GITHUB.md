# 🚀 GitHub + IONOS Setup Anleitung

## Schritt 1: GitHub Repository erstellen

1. **Gehe zu GitHub.com** und erstelle ein neues Repository:
   - Klicke auf "New repository"
   - Name: `ratatosk` (oder wie du möchtest)
   - **WICHTIG**: Repository **NICHT** mit README initialisieren
   - Klicke "Create repository"

2. **Verbinde dein lokales Repository mit GitHub:**
   ```bash
   git remote add origin https://github.com/DEIN_USERNAME/ratatosk.git
   git branch -M main
   git push -u origin main
   ```

## Schritt 2: IONOS FTP-Zugangsdaten sammeln

Du brauchst folgende Informationen von deinem IONOS Hosting:

1. **FTP Server**: z.B. `ftp.deine-domain.de` oder `ftp.ionos.de`
2. **FTP Benutzername**: Dein IONOS FTP Benutzername
3. **FTP Passwort**: Dein IONOS FTP Passwort

**Wo findest du diese Daten?**
- IONOS Control Panel → Hosting → Dein Hosting-Paket → FTP-Zugang

## Schritt 3: GitHub Secrets konfigurieren

1. **Gehe zu deinem GitHub Repository**
2. **Klicke auf "Settings"** (Tab oben)
3. **Klicke auf "Secrets and variables"** → **"Actions"**
4. **Klicke "New repository secret"** und füge hinzu:

   **Secret 1:**
   - Name: `FTP_SERVER`
   - Value: `ftp.deine-domain.de` (dein FTP Server)

   **Secret 2:**
   - Name: `FTP_USERNAME`
   - Value: `dein-ftp-benutzername`

   **Secret 3:**
   - Name: `FTP_PASSWORD`
   - Value: `dein-ftp-passwort`

## Schritt 4: Erste Deployment testen

1. **Mache eine kleine Änderung** in deinem Code
2. **Committe und pushe:**
   ```bash
   git add .
   git commit -m "Test deployment"
   git push
   ```
3. **Gehe zu GitHub → Actions** und schaue dir den Workflow an
4. **Nach erfolgreichem Deployment** ist deine App unter `https://deine-domain.de` verfügbar

## Schritt 5: Automatisches Deployment aktiviert! 🎉

Ab jetzt wird bei jedem `git push` automatisch:
- Das Projekt gebaut
- Auf deinen IONOS Server hochgeladen
- Deine Website aktualisiert

## Troubleshooting

**Falls das Deployment fehlschlägt:**
1. Überprüfe deine FTP-Zugangsdaten
2. Stelle sicher, dass der `public_html` Ordner auf deinem Server existiert
3. Schaue in die GitHub Actions Logs für Details

**Falls die Website nicht lädt:**
1. Überprüfe, ob die Dateien im `public_html` Ordner angekommen sind
2. Stelle sicher, dass deine Domain korrekt konfiguriert ist
3. Warte 5-10 Minuten (DNS-Propagation)

## Nächste Schritte

Nach dem Setup kannst du einfach:
```bash
# Änderungen machen
# Dann committen und pushen
git add .
git commit -m "Neue Features"
git push
# → Automatisches Deployment! 🚀
``` 