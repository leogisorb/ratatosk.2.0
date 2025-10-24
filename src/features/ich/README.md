# Ich Dialog

Ein komplett neuer ich-dialog, der 1:1 wie der pain-dialog funktioniert, aber mit den Inhalten aus dem ich-standalone Projekt.

## Struktur

### Main Regions (Hauptkategorien)
- **ERNÄHRUNG** - Essen und Trinken
- **GEFÜHLE** - Emotionale Zustände
- **KLEIDUNG** - Bekleidung und Accessoires
- **HYGIENE** - Körperpflege
- **BEWEGUNG** - Körperliche Aktivitäten
- **ZURÜCK** - Navigation zurück

### Sub Regions (Unterkategorien)

#### Ernährung
- Hauptkategorien: Essen, Trinken
- Geschmacksrichtungen: süß, herzhaft, scharf
- Temperaturen: kalt, warm, lauwarm
- Konsistenzen: trocken, nass, breiig
- Getränke: Wasser, Saft, Milch

#### Gefühle
- Grundgefühle: glücklich, traurig, wütend, ängstlich
- Körpergefühle: müde, energisch, entspannt, angespannt
- Soziale Gefühle: einsam, geliebt, stolz, Scham

#### Kleidung
- Oberbekleidung: Mütze, Ohrstöpsel, Schal, Hemd
- Kleidung: T-Shirt, Pullover, Jacke, Hose
- Accessoires: Socken, Schuhe, Unterwäsche

#### Hygiene
- Körperpflege: Duschen, Bad, Haare waschen, Zähne putzen
- Gesichtspflege: Gesicht waschen, Rasieren, Creme auftragen
- Toilette: Toilette, Hände waschen

#### Bewegung
- Grundbewegungen: Gehen, Laufen, Stehen, Sitzen
- Aktivitäten: Sport, Spazieren, Tanzen, Yoga
- Entspannung: Dehnen, Massage, Meditieren

## Features

- **Grid Layout** für Desktop (3x2 Grid)
- **Karussell Layout** für Sub-Regions
- **Keyboard Navigation** (Pfeiltasten, Enter, Leertaste)
- **Right-Click Navigation** als Alternative
- **Responsive Design** für Mobile und Desktop
- **TTS Integration** (vorbereitet)
- **Smooth Animations** und Transitions

## Verwendung

### Route
```
/ich-dialog
```

### Navigation
1. **Main View**: Wählen Sie eine Hauptkategorie
2. **Sub View**: Wählen Sie eine Unterkategorie
3. **Confirmation**: Bestätigung der Auswahl

### Keyboard Shortcuts
- **Pfeiltasten**: Navigation zwischen Items
- **Enter/Leertaste**: Auswahl bestätigen
- **Escape**: Zurück zur vorherigen Ansicht

## Technische Details

### Komponenten
- `IchDialogView.vue` - Hauptkomponente
- `IchDialogView.css` - Styling
- `useIchDialogFlow.ts` - State Management
- `ichDialogData.ts` - Datenstrukturen

### State Management
- `currentState`: Aktueller Dialog-Zustand
- `currentTileIndex`: Aktuell ausgewähltes Item
- `selectedMainRegion`: Ausgewählte Hauptkategorie
- `selectedSubRegion`: Ausgewählte Unterkategorie

### CSS Features
- CSS Grid für Desktop Layout
- 3D Karussell für Sub-Regions
- Smooth Transitions und Animations
- Responsive Breakpoints
- Hover und Focus States
