# Ratatosk

Bachelorarbeit über einen Kommunikationsassistent als Website. Steuerung mit Augenblinzeln über eine Webcam oder klicken/touch möglich. 
Einmaliges laden notwendig zur Verwendung der Website. Danach ist keine stetige Verbindung mit dem Internet notwendig. <br>
Gesichtserkennung über Facemesh KI Model von Mediapipe, Lizenz Apache 2.0<br>
Vue.js als JavaScript Framework, Lizenz MIT<br>
Warnton, Lizenz Attribution 3.0<br>
icons Uicons by <a href="https://www.flaticon.com/uicons">Flaticon</a>


## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Pre-Setup
```sh
node -v
```
Muss Verison 16 sein!
(installation über nvm)

## Project Setup

```sh
git clone http://gitlab.gabler.wtf/Barbara/ratatosk.git
```

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production
Verursacht aufgrund node-Abhängigkeiten:
```sh
cp -R /home/$user/ratatosk/node_modules/vue /home/$user/ratatosk/vue
```

```sh
npm run build
```

### Deployment
Inhalt des dist-Ordners in /var/www/html Verzeichnis kopieren
```sh
cp -R /home/$user/ratatosk/dist /var/www/html
```

Achtung! vue-Ordner muss ebenfalls in den gleichen Ordner kopiert werden
```sh
cp -R /home/$user/ratatosk/vue /var/www/html/vue
```
