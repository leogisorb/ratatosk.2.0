/**
 * Erweiterte TTS-Implementierung mit Fallback-Optionen
 * Unterstützt verschiedene Browser und Plattformen
 */

class AdvancedTTSManager {
  constructor() {
    this.currentProvider = 'web-speech';
    this.providers = {
      'web-speech': this.webSpeechProvider.bind(this),
      'external-api': this.externalAPIProvider.bind(this),
      'audio-files': this.audioFilesProvider.bind(this)
    };
    this.isInitialized = false;
    this.voice = null;
    this.fallbackVoices = [];
    this.audioCache = new Map();
    
    this.init();
  }

  async init() {
    console.log('Advanced TTS: Initialisiere...');
    
    try {
      // Teste Web Speech API
      if ('speechSynthesis' in window) {
        await this.initWebSpeech();
        this.currentProvider = 'web-speech';
        console.log('Advanced TTS: Web Speech API verfügbar');
      } else {
        console.warn('Advanced TTS: Web Speech API nicht verfügbar');
        this.currentProvider = 'audio-files';
      }
      
      this.isInitialized = true;
      console.log('Advanced TTS: Initialisierung abgeschlossen');
      
    } catch (error) {
      console.error('Advanced TTS: Fehler bei Initialisierung:', error);
      this.currentProvider = 'audio-files';
      this.isInitialized = true;
    }
  }

  async initWebSpeech() {
    return new Promise((resolve) => {
      const synth = window.speechSynthesis;
      
      const setVoice = () => {
        try {
          const voices = synth.getVoices();
          console.log('Advanced TTS: Verfügbare Stimmen:', voices.length);
          
          // Suche nach deutschen Stimmen
          this.voice = voices.find(voice => 
            voice.lang.includes('de') && 
            (voice.name.includes('Zira') || 
             voice.name.includes('Hedda') || 
             voice.name.includes('Katrin') ||
             voice.name.includes('Google Deutsch') ||
             voice.name.includes('Anna'))
          ) || voices.find(voice => voice.lang.includes('de')) || voices[0];
          
          if (this.voice) {
            console.log('Advanced TTS: Stimme ausgewählt:', this.voice.name);
          }
          
          resolve();
        } catch (error) {
          console.error('Advanced TTS: Fehler bei Stimmen-Initialisierung:', error);
          resolve();
        }
      };

      if (synth.getVoices().length > 0) {
        setVoice();
      } else {
        synth.addEventListener('voiceschanged', setVoice);
        setTimeout(resolve, 3000); // Timeout nach 3 Sekunden
      }
    });
  }

  webSpeechProvider(text) {
    return new Promise((resolve, reject) => {
      try {
        const synth = window.speechSynthesis;
        
        // Stoppe nur wenn wirklich gesprochen wird
        if (synth.speaking) {
          synth.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        if (this.voice) {
          utterance.voice = this.voice;
        }
        
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;
        utterance.lang = 'de-DE';
        
        utterance.onstart = () => {
          console.log('Advanced TTS: Web Speech gestartet:', text);
          // Setze globale Flag
          if (typeof window.isSpeaking !== 'undefined') {
            window.isSpeaking = true;
          }
        };
        
        utterance.onend = () => {
          console.log('Advanced TTS: Web Speech beendet:', text);
          // Reset globale Flag
          if (typeof window.isSpeaking !== 'undefined') {
            window.isSpeaking = false;
          }
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error('Advanced TTS: Web Speech Fehler:', event.error);
          // Reset globale Flag
          if (typeof window.isSpeaking !== 'undefined') {
            window.isSpeaking = false;
          }
          
          // Ignoriere "canceled" Fehler, da diese normal sind
          if (event.error === 'canceled') {
            console.log('Advanced TTS: Web Speech abgebrochen (normal)');
            resolve(); // Behandle als erfolgreich
          } else {
            reject(new Error(`Web Speech Fehler: ${event.error}`));
          }
        };
        
        synth.speak(utterance);
        
      } catch (error) {
        console.error('Advanced TTS: Web Speech kritischer Fehler:', error);
        // Reset globale Flag
        if (typeof window.isSpeaking !== 'undefined') {
          window.isSpeaking = false;
        }
        reject(error);
      }
    });
  }

  externalAPIProvider(text) {
    // Fallback für externe TTS-APIs (z.B. Google Text-to-Speech)
    return new Promise((resolve, reject) => {
      console.log('Advanced TTS: Externe API nicht implementiert, verwende Web Speech');
      this.webSpeechProvider(text).then(resolve).catch(reject);
    });
  }

  audioFilesProvider(text) {
    return new Promise((resolve, reject) => {
      try {
        // Da Audio-Dateien nicht verfügbar sind, verwende Web Speech als Fallback
        console.log('Advanced TTS: Audio-Dateien nicht verfügbar, verwende Web Speech');
        this.webSpeechProvider(text).then(resolve).catch(reject);
        
      } catch (error) {
        console.error('Advanced TTS: Audio-Files Fehler:', error);
        reject(error);
      }
    });
  }

  async speak(text) {
    if (!text || !this.isInitialized) {
      console.log('Advanced TTS: Nicht ausgeführt - Text:', text, 'Initialisiert:', this.isInitialized);
      return;
    }
    
    // Prüfe globale speaking Flag (falls verfügbar)
    if (typeof window.isSpeaking !== 'undefined' && window.isSpeaking) {
      console.log('Advanced TTS: Überspringe - globale Flag aktiv');
      return;
    }
    
    console.log('Advanced TTS: Versuche zu sprechen:', text);
    
    try {
      const provider = this.providers[this.currentProvider];
      if (provider) {
        await provider(text);
      } else {
        console.error('Advanced TTS: Unbekannter Provider:', this.currentProvider);
      }
    } catch (error) {
      console.error('Advanced TTS: Fehler beim Sprechen:', error);
      // Reset globale Flag
      if (typeof window.isSpeaking !== 'undefined') {
        window.isSpeaking = false;
      }
    }
  }

  stop() {
    try {
      if (this.currentProvider === 'web-speech' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      // Stoppe alle Audio-Dateien
      this.audioCache.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      
      console.log('Advanced TTS: Gestoppt');
    } catch (error) {
      console.error('Advanced TTS: Fehler beim Stoppen:', error);
    }
  }

  test() {
    console.log('Advanced TTS: Teste Sprachsynthese...');
    this.speak('Test der erweiterten Sprachsynthese');
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      currentProvider: this.currentProvider,
      voice: this.voice ? this.voice.name : 'Keine',
      webSpeechAvailable: 'speechSynthesis' in window,
      audioCacheSize: this.audioCache.size
    };
  }
}

// Globale Instanz erstellen
window.advancedTTS = new AdvancedTTSManager();

// Status nach 3 Sekunden ausgeben
setTimeout(() => {
  if (window.advancedTTS) {
    console.log('Advanced TTS: Status:', window.advancedTTS.getStatus());
  }
}, 3000); 