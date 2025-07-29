class SpeechManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voice = null;
        this.isSpeaking = false;
        this.initVoice();
    }

    initVoice() {
        // Warte auf verfügbare Stimmen
        this.synth.onvoiceschanged = () => {
            const voices = this.synth.getVoices();
            // Suche nach einer deutschen Stimme
            this.voice = voices.find(voice => voice.lang.includes('de')) || voices[0];
            console.log('Verfügbare Stimmen:', voices.length);
            console.log('Gewählte Stimme:', this.voice ? this.voice.name : 'Keine');
        };
    }

    speak(text) {
        console.log('TTS versucht zu sprechen:', text);
        
        if (this.isSpeaking) {
            this.synth.cancel();
        }

        if (!this.voice) {
            console.error('Keine Stimme gefunden!');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.voice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        this.isSpeaking = true;
        
        utterance.onstart = () => {
            console.log('TTS gestartet für:', text);
        };
        
        utterance.onerror = (e) => {
            console.error('TTS Fehler:', e);
            this.isSpeaking = false;
        };
        
        utterance.onend = () => {
            console.log('TTS beendet für:', text);
            this.isSpeaking = false;
        };

        try {
            this.synth.speak(utterance);
            console.log('TTS Befehl gesendet');
        } catch (error) {
            console.error('Fehler beim TTS-Aufruf:', error);
            this.isSpeaking = false;
        }
    }

    stop() {
        if (this.isSpeaking) {
            this.synth.cancel();
            this.isSpeaking = false;
            console.log('TTS gestoppt');
        }
    }
}

// Erstelle eine globale Instanz
window.speechManager = new SpeechManager(); 