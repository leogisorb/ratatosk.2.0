class SpeechManager {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voice = null;
    this.isInitialized = false;
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.fallbackVoices = [];
    this.initVoice();
  }

  initVoice() {
    console.log('TTS: Initialisiere Sprachsynthese...');
    
    const setVoice = () => {
      try {
        const voices = this.synthesis.getVoices();
        console.log('TTS: Verfügbare Stimmen:', voices.length);
        console.log('TTS: Stimmen-Liste:', voices.map(v => `${v.name} (${v.lang})`));
        
        // Suche nach deutschen Stimmen (Priorität: weiblich, dann männlich, dann andere)
        this.voice = voices.find(voice => 
          voice.lang.includes('de') && 
          (voice.name.includes('Zira') || 
           voice.name.includes('Hedda') || 
           voice.name.includes('Katrin') ||
           voice.name.includes('Google Deutsch') ||
           voice.name.includes('Anna') ||
           voice.name.toLowerCase().includes('female'))
        ) || voices.find(voice => 
          voice.lang.includes('de') && 
          (voice.name.includes('Markus') ||
           voice.name.includes('Thomas') ||
           voice.name.toLowerCase().includes('male'))
        ) || voices.find(voice => voice.lang.includes('de')) || voices[0];
        
        // Fallback-Stimmen für verschiedene Sprachen
        this.fallbackVoices = [
          voices.find(voice => voice.lang.includes('en')) || null,
          voices.find(voice => voice.lang.includes('fr')) || null,
          voices[0] || null
        ].filter(Boolean);
        
        if (this.voice) {
          console.log('TTS: Ausgewählte Stimme:', this.voice.name, '(', this.voice.lang, ')');
        } else {
          console.warn('TTS: Keine deutsche Stimme gefunden, verwende Fallback');
          this.voice = this.fallbackVoices[0];
        }
        
        this.isInitialized = true;
        console.log('TTS: Initialisierung abgeschlossen');
        
      } catch (error) {
        console.error('TTS: Fehler bei der Stimmen-Initialisierung:', error);
        this.isInitialized = false;
      }
    };

    // Versuche sofort zu initialisieren
    if (this.synthesis.getVoices().length > 0) {
      setVoice();
    } else {
      // Warte auf voiceschanged Event
      this.synthesis.addEventListener('voiceschanged', setVoice);
      
      // Timeout nach 3 Sekunden
      setTimeout(() => {
        if (!this.isInitialized) {
          console.warn('TTS: Timeout bei Stimmen-Initialisierung, verwende Standard');
          setVoice();
        }
      }, 3000);
    }
  }

  speak(text) {
    if (!text || !this.isInitialized) {
      console.log('TTS: Nicht ausgeführt - Text:', text, 'Initialisiert:', this.isInitialized);
      return;
    }
   
    // Prüfe globale speaking Flag (falls verfügbar)
    if (typeof window.isSpeaking !== 'undefined' && window.isSpeaking) {
      console.log('TTS: Überspringe - globale Flag aktiv');
      return;
    }
   
    console.log('TTS: Versuche zu sprechen:', text);
    
    try {
      // Verhindere doppelte Wiedergabe
      if (this.isSpeaking) {
        console.log('TTS bereits aktiv, breche vorherige Wiedergabe ab');
        this.stop();
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Stimme setzen
      if (this.voice) {
        utterance.voice = this.voice;
      }
      
      // Einstellungen für bessere Qualität
      utterance.rate = 1.1;     // Etwas schneller für jüngeren Klang
      utterance.pitch = 1.2;    // Höhere Stimme für jüngeren Klang
      utterance.volume = 1.0;   // 100% Lautstärke
      utterance.lang = 'de-DE'; // Deutsche Sprache erzwingen
      
      // Event-Handler
      utterance.onstart = () => {
        this.isSpeaking = true;
        this.currentUtterance = utterance;
        // Setze globale Flag
        if (typeof window.isSpeaking !== 'undefined') {
          window.isSpeaking = true;
        }
        console.log('TTS gestartet:', text);
      };
      
      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        // Reset globale Flag
        if (typeof window.isSpeaking !== 'undefined') {
          window.isSpeaking = false;
        }
        console.log('TTS beendet:', text);
      };
      
      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        // Reset globale Flag
        if (typeof window.isSpeaking !== 'undefined') {
          window.isSpeaking = false;
        }
        console.error('TTS Fehler:', event.error);
        
        // Ignoriere "canceled" Fehler, da diese normal sind
        if (event.error === 'canceled') {
          console.log('TTS: Web Speech abgebrochen (normal)');
          return; // Beende ohne weitere Aktion
        }
        
        // Versuche Fallback-Stimme nur bei echten Fehlern
        if (this.fallbackVoices.length > 0 && this.voice !== this.fallbackVoices[0]) {
          console.log('TTS: Versuche Fallback-Stimme...');
          this.voice = this.fallbackVoices[0];
          setTimeout(() => this.speak(text), 100);
        }
      };
      
      // Sprechen starten
      this.synthesis.speak(utterance);
      
    } catch (error) {
      console.error('TTS: Kritischer Fehler beim Sprechen:', error);
      this.isSpeaking = false;
      // Reset globale Flag
      if (typeof window.isSpeaking !== 'undefined') {
        window.isSpeaking = false;
      }
    }
  }

  stop() {
    try {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      console.log('TTS gestoppt');
    } catch (error) {
      console.error('TTS: Fehler beim Stoppen:', error);
    }
  }

  // Test-Funktion
  test() {
    console.log('TTS: Teste Sprachsynthese...');
    this.speak('Test der Sprachsynthese');
  }

  // Status-Abfrage
  getStatus() {
    return {
      initialized: this.isInitialized,
      speaking: this.isSpeaking,
      voice: this.voice ? this.voice.name : 'Keine',
      language: this.voice ? this.voice.lang : 'Keine',
      availableVoices: this.synthesis.getVoices().length
    };
  }

  setVolume(volume) {
    // Volume wird pro Utterance gesetzt, nicht global
    console.log('TTS Lautstärke gesetzt auf:', volume);
  }
}

// Globale Instanz erstellen
window.speechManager = new SpeechManager();

// Test nach 2 Sekunden
setTimeout(() => {
  if (window.speechManager) {
    console.log('TTS: Status nach Initialisierung:', window.speechManager.getStatus());
    // window.speechManager.test(); // Uncomment für automatischen Test
  }
}, 2000); 