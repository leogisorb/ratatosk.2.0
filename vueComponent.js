import { createApp } from 'vue/dist/vue.esm-bundler.js';

const picture_click = createApp({
  el: "#picture_click",
  data() {
    return {
      width: 10,
      height: 10,
      padding: 10,
      waittime: 1000,
      auswahl: "Nichts Ausgewählt",
      nachricht: "",
      variableToPass: showMenu
    }
  },
  computed: {
    computedElement() {
      return this.selectedElement;
    },
    computedMenu: {
      get() {
        return this.showMenu;
      },
      set(newMenu) {
        this.showMenu = newMenu;
      }
    }
  },
  methods: {
    colorElement() {
      let wantElement = document.getElementById("SOS");
      wantElement.style.backgroundColor = "#D2691E";
    },
    playBell() {
      if (window.audioManager) {
        window.audioManager.playBell();
      } else {
        console.error('AudioManager nicht gefunden');
      }
    },
    stopBell() {
      if (window.audioManager) {
        window.audioManager.stopBell();
      }
    },
    cngAusw(text) {
      let ausgabe = document.getElementById("Auswahl");
      ausgabe.innerHTML = text;
    },
    addChar(character) {
      let nachricht = document.getElementById("msg");
      nachricht.value += character;
    },
    delChar() {
      let nachricht = document.getElementById("msg");
      nachricht.value = nachricht.value.slice(0, -1);
    },
    delallChar() {
      let nachricht = document.getElementById("msg");
      nachricht.value = "";
    },
    dayNight() {
      var element = document.body;
      element.classList.toggle("dark");
    },
    colorElement(elementID, menuValue) {
      this.selectedElement = elementID;
      let elementToColour = document.getElementById(elementID);
      if ((elementToColour) && (this.showMenu == menuValue)) {
        elementToColour.style.filter = 'invert(47%) sepia(79%) saturate(525%) hue-rotate(342deg) brightness(88%) contrast(96%)';
        
        // Text-to-Speech für Nachrichtenmenü
        if (this.showMenu >= 3 && this.showMenu < 4) {
          const text = elementToColour.textContent || elementToColour.value;
          console.log('Element wird orange:', elementID, 'Text:', text, 'Menu:', this.showMenu);
          if (text && window.speechManager) {
            window.speechManager.speak(text);
          } else {
            console.log('TTS nicht ausgeführt - Text:', text, 'speechManager:', !!window.speechManager);
          }
        }
      }
    },
    blancElement(elementID, menuValue) {
      let elementToBlanc = document.getElementById(elementID);
      if ((elementToBlanc) && (this.showMenu == menuValue)) {
        elementToBlanc.style.filter = 'none';
        
        // Stoppe Text-to-Speech wenn Element nicht mehr ausgewählt ist
        if (this.showMenu >= 3 && this.showMenu < 4 && window.speechManager) {
          window.speechManager.stop();
        }
      }
    },
    colormain() {
      setTimeout(() => {
        if (this.showMenu == 0) {
          this.blancElement("EIN", 0);
          this.colorElement("SOS", 0);
          setTimeout(() => {
            if (this.showMenu == 0) {
              this.blancElement("SOS", 0);
              this.colorElement("AUA", 0);
              setTimeout(() => {
                if (this.showMenu == 0) {
                  this.blancElement("AUA", 0);
                  this.colorElement("NAC", 0);
                  setTimeout(() => {
                    if (this.showMenu == 0) {
                      this.blancElement("NAC", 0);
                      this.colorElement("HYG", 0);
                      setTimeout(() => {
                        if (this.showMenu == 0) {
                          this.blancElement("HYG", 0);
                          this.colorElement("EIN", 0);
                          setTimeout(() => {
                            if (this.showMenu == 0) {
                              this.blancElement("EIN", 0);
                              this.colormain();
                            }
                          }, (this.waittime));
                        }
                      }, (this.waittime));
                    }
                  }, (this.waittime));
                }
              }, (this.waittime));
            }
          }, (this.waittime));
        }
      });
    }
  },
  watch: {
    showMenu() {
      if (this.showMenu == 0) {
        this.colormain();
      }
    }
  }
}).mount('#picture_click');