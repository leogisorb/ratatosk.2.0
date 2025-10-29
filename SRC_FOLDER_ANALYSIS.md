# 📁 SRC Ordnerstruktur Analyse - 28. Januar 2025

## 📊 **Übersicht der Ordnerstruktur**

```
src/
├── 📁 assets/              ✅ GUT - Icons und CSS
├── 📁 composables/         ⚠️  MINIMAL - Nur 1 Datei
├── 📁 config/              ✅ GUT - Konfiguration
├── 📁 core/                ✅ GUT - Clean Architecture
├── 📁 features/            ✅ GUT - Feature-basiert
├── 📁 router/              ✅ GUT - Routing
└── 📁 shared/              ✅ GUT - Geteilte Komponenten
```

---

## 🔍 **Detaillierte Analyse**

### ✅ **GUTE Ordner (behalten):**

#### **1. `src/assets/` - ✅ PERFEKT**
```
assets/
├── blinzeldauer.svg        ✅ Settings-Icons
├── farbmodus.svg          ✅ Settings-Icons
├── impressum.svg          ✅ Settings-Icons
├── kamera.svg             ✅ Settings-Icons
├── kameraposition.svg     ✅ Settings-Icons
├── leuchtdauer.svg        ✅ Settings-Icons
├── logo.svg               ✅ App-Logo
└── main.css               ✅ Haupt-CSS
```
**Status:** ✅ Alle Icons werden verwendet, gut organisiert

#### **2. `src/config/` - ✅ GUT**
```
config/
├── gridConfig.ts          ✅ Grid-Konfiguration
└── ttsConfig.ts           ✅ TTS-Konfiguration
```
**Status:** ✅ Konfigurationsdateien, sauber organisiert

#### **3. `src/core/` - ✅ SEHR GUT**
```
core/
├── application/
│   ├── services/          ✅ Application Services
│   └── SimpleFlowController.ts ✅ Flow Control
├── domain/
│   ├── entities/          ✅ Domain Entities
│   └── repositories/      ✅ Repository Interfaces
└── utils/
    ├── leuchtdauerUtils.ts ✅ Utility Functions
    └── README_Leuchtdauer.md ✅ Dokumentation
```
**Status:** ✅ Clean Architecture perfekt implementiert

#### **4. `src/features/` - ✅ SEHR GUT**
```
features/
├── communication/         ✅ Vollständiges Feature
├── face-recognition/      ✅ Sauber isoliert
├── ich/                   ✅ Dialog-System
├── navigation/            ✅ Routing & Navigation
├── pain-assessment/       ✅ Vollständiges Feature
├── settings/              ⚠️  PROBLEM (siehe unten)
├── umgebung-dialog/       ✅ Dialog-System
└── warning/               ✅ Warning-System
```
**Status:** ✅ Feature-basierte Organisation perfekt

#### **5. `src/router/` - ✅ GUT**
```
router/
└── index.ts               ✅ Router-Konfiguration
```
**Status:** ✅ Sauber, aber alte Routes müssen entfernt werden

#### **6. `src/shared/` - ✅ SEHR GUT**
```
shared/
├── components/            ✅ Wiederverwendbare Komponenten
├── composables/           ✅ Geteilte Composables
├── styles/                ✅ Zentrale CSS
└── types/                 ✅ Shared Types
```
**Status:** ✅ Perfekte Shared-Organisation

---

### ⚠️ **PROBLEMATISCHE Ordner:**

#### **1. `src/composables/` - ⚠️ MINIMAL**
```
composables/
└── useDarkMode.ts         ⚠️  Nur 1 Datei
```
**Problem:** Nur eine Datei, könnte in `shared/composables/` verschoben werden

**Lösung:** 
- [ ] `useDarkMode.ts` nach `shared/composables/` verschieben
- [ ] `src/composables/` Ordner löschen

---

### ❌ **ÜBERFLÜSSIGE Dateien/Ordner:**

#### **1. Alte Settings-Views - ❌ ENTFERNEN**
```
src/features/settings/views/
├── BlinzeldauerView.vue        ❌ Alte View (durch SettingsDialogView ersetzt)
├── BlitzdauerView.vue          ❌ Alte View (durch SettingsDialogView ersetzt)
├── FarbmodusView.vue           ❌ Alte View (durch SettingsDialogView ersetzt)
├── ImpressumView.vue           ❌ Alte View (durch SettingsDialogView ersetzt)
├── KamerapositionView.vue      ❌ Alte View (durch SettingsDialogView ersetzt)
├── KameraView.vue              ❌ Alte View (durch SettingsDialogView ersetzt)
├── LeuchtDauerView.vue         ❌ Alte View (durch SettingsDialogView ersetzt)
├── SlashSettingsView.css       ❌ Alte CSS (durch DialogBase.css ersetzt)
├── SlashSettingsView.ts        ❌ Alte View (durch SettingsDialogView ersetzt)
└── SlashSettingsView.vue       ❌ Alte View (durch SettingsDialogView ersetzt)
```

**Status:** ❌ Diese Views werden nicht mehr verwendet, da `SettingsDialogView` alle Funktionen übernimmt

**Aktion:** 
- [ ] Alle alten Settings-Views löschen
- [ ] Router-Routes für alte Views entfernen

#### **2. Code-Duplikation - ❌ KONSOLIDIEREN**
```
src/features/ich/composables/usePainAssessment.ts           ❌ Duplikat
src/features/umgebung-dialog/composables/usePainAssessment.ts ❌ Duplikat
src/features/pain-assessment/composables/usePainAssessment.ts ✅ Original
```

**Status:** ❌ `usePainAssessment.ts` ist in 3 Features dupliziert

**Aktion:**
- [ ] `usePainAssessment.ts` nach `shared/composables/` verschieben
- [ ] Doppelte Dateien entfernen
- [ ] Imports in allen Features aktualisieren

---

## 🎯 **Konkrete Aufräum-Aktionen:**

### **Priorität 1: Alte Settings-Views entfernen**

#### **1.1 Alte Views löschen**
```bash
# Alte Settings-Views entfernen
rm src/features/settings/views/BlinzeldauerView.vue
rm src/features/settings/views/BlitzdauerView.vue
rm src/features/settings/views/FarbmodusView.vue
rm src/features/settings/views/ImpressumView.vue
rm src/features/settings/views/KamerapositionView.vue
rm src/features/settings/views/KameraView.vue
rm src/features/settings/views/LeuchtDauerView.vue
rm src/features/settings/views/SlashSettingsView.css
rm src/features/settings/views/SlashSettingsView.ts
rm src/features/settings/views/SlashSettingsView.vue
```

#### **1.2 Router bereinigen**
```typescript
// Router index.ts - Alte Imports entfernen
// ENTFERNEN:
import LeuchtDauerView from '../features/settings/views/LeuchtDauerView.vue'
import BlinzeldauerView from '../features/settings/views/BlinzeldauerView.vue'
import BlitzdauerView from '../features/settings/views/BlitzdauerView.vue'
import FarbmodusView from '../features/settings/views/FarbmodusView.vue'
import ImpressumView from '../features/settings/views/ImpressumView.vue'
import KamerapositionView from '../features/settings/views/KamerapositionView.vue'
import KameraView from '../features/settings/views/KameraView.vue'

// ENTFERNEN: Alte Routes
- /einstellungen/leuchtdauer
- /einstellungen/blitzdauer
- /einstellungen/farbmodus
- /einstellungen/kamera
- /einstellungen/kamerapositionen
- /einstellungen/impressum
```

### **Priorität 2: Code-Duplikation beheben**

#### **2.1 usePainAssessment.ts konsolidieren**
```bash
# Original nach shared verschieben
mv src/features/pain-assessment/composables/usePainAssessment.ts src/shared/composables/

# Duplikate entfernen
rm src/features/ich/composables/usePainAssessment.ts
rm src/features/umgebung-dialog/composables/usePainAssessment.ts
```

#### **2.2 Imports aktualisieren**
```typescript
// In allen Features:
// VORHER:
import { usePainAssessment } from '../composables/usePainAssessment'

// NACHHER:
import { usePainAssessment } from '@/shared/composables/usePainAssessment'
```

### **Priorität 3: Composables-Ordner aufräumen**

#### **3.1 useDarkMode.ts verschieben**
```bash
# useDarkMode nach shared verschieben
mv src/composables/useDarkMode.ts src/shared/composables/

# Leeren Ordner löschen
rmdir src/composables/
```

---

## 📊 **Nach der Aufräumung:**

### **Neue, saubere Struktur:**
```
src/
├── 📁 assets/              ✅ Icons und CSS
├── 📁 config/              ✅ Konfiguration
├── 📁 core/                ✅ Clean Architecture
├── 📁 features/            ✅ Feature-basiert
│   ├── communication/      ✅ Vollständig
│   ├── face-recognition/   ✅ Sauber
│   ├── ich/                ✅ Dialog-System
│   ├── navigation/         ✅ Routing
│   ├── pain-assessment/    ✅ Vollständig
│   ├── settings/           ✅ Nur SettingsDialogView
│   ├── umgebung-dialog/    ✅ Dialog-System
│   └── warning/            ✅ Warning-System
├── 📁 router/              ✅ Bereinigt
└── 📁 shared/              ✅ Erweitert
    ├── components/         ✅ UI-Komponenten
    ├── composables/        ✅ useDarkMode + usePainAssessment
    ├── styles/             ✅ DialogBase.css
    └── types/              ✅ Shared Types
```

### **Entfernte Dateien:**
- ❌ 7 alte Settings-Views
- ❌ 3 SlashSettings-Dateien
- ❌ 2 doppelte usePainAssessment.ts
- ❌ 1 leerer composables-Ordner

### **Gesparte Dateien:** 13 Dateien weniger! 🎉

---

## 🚀 **Vorteile der Aufräumung:**

1. **Saubere Architektur:** Keine veralteten Views mehr
2. **Keine Duplikation:** usePainAssessment.ts zentralisiert
3. **Bessere Wartbarkeit:** Weniger Dateien zu pflegen
4. **Klarere Struktur:** Jeder Ordner hat einen klaren Zweck
5. **Konsistente Imports:** Alle Features verwenden shared/composables

---

## 📋 **Checkliste für Aufräumung:**

### **Phase 1: Alte Views entfernen**
- [ ] Alte Settings-Views löschen (7 Dateien)
- [ ] SlashSettings-Dateien löschen (3 Dateien)
- [ ] Router-Imports entfernen (7 Imports)
- [ ] Router-Routes entfernen (6 Routes)

### **Phase 2: Code-Duplikation beheben**
- [ ] usePainAssessment.ts nach shared verschieben
- [ ] Doppelte usePainAssessment.ts entfernen (2 Dateien)
- [ ] Imports in allen Features aktualisieren

### **Phase 3: Composables aufräumen**
- [ ] useDarkMode.ts nach shared verschieben
- [ ] Leeren composables-Ordner löschen

**Gesamt: 13 Dateien entfernen, 2 Dateien verschieben** 🎯

---

*Analyse erstellt am: 28. Januar 2025*  
*Nächste Aktion: Aufräumung durchführen*
