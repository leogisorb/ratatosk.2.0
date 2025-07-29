class AudioManager {
    constructor() {
        this.bell = new Audio('./ServiceGlocke.wav');
        this.bell.volume = 1.0;
        this.bell.preload = 'auto';
    }

    playBell() {
        try {
            this.bell.currentTime = 0;
            const playPromise = this.bell.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Sound wird abgespielt');
                    })
                    .catch(error => {
                        console.error('Fehler beim Abspielen:', error);
                    });
            }
        } catch (error) {
            console.error('Fehler bei der Audio-Wiedergabe:', error);
        }
    }

    stopBell() {
        try {
            this.bell.pause();
            this.bell.currentTime = 0;
        } catch (error) {
            console.error('Fehler beim Stoppen des Sounds:', error);
        }
    }
}

window.audioManager = new AudioManager(); 