# 🏗️ Ratatosk - Clean Architecture Design

## 📋 Aktuelle Probleme

### ❌ Identifizierte Architektur-Probleme:
1. **Chaotische View-Struktur:** 21 Views ohne klare Hierarchie
2. **Fehlende Domain-Logik:** Business Logic in Views vermischt  
3. **Keine Service-Layer:** Direkte API-Calls in Komponenten
4. **Inkonsistente Naming:** Deutsche/Englische Mischung
5. **Fehlende Abstraktion:** Code-Duplikation zwischen Views
6. **Keine Error-Handling:** Fehlerbehandlung nicht zentralisiert
7. **Monolithische Komponenten:** Views sind zu groß und komplex
8. **Fehlende Separation of Concerns:** UI, Logic und Data vermischt

## 🎯 Neue Clean Architecture

### 📁 Ordentliche Projektstruktur

```
src/
├── 📁 core/                    # Kern-Business-Logic
│   ├── 📁 domain/              # Domain Entities & Business Rules
│   │   ├── entities/           # Domain Entities
│   │   ├── repositories/      # Repository Interfaces
│   │   └── services/           # Domain Services
│   ├── 📁 application/         # Use Cases & Application Logic
│   │   ├── use-cases/         # Use Case Implementations
│   │   ├── services/          # Application Services
│   │   └── dto/               # Data Transfer Objects
│   └── 📁 infrastructure/     # External Dependencies
│       ├── repositories/      # Repository Implementations
│       ├── api/              # API Clients
│       └── storage/          # Local Storage
├── 📁 features/               # Feature-basierte Organisation
│   ├── 📁 communication/      # Kommunikations-Feature
│   │   ├── components/       # Feature-spezifische Komponenten
│   │   ├── views/            # Feature-spezifische Views
│   │   ├── stores/           # Feature-spezifische Stores
│   │   └── composables/      # Feature-spezifische Composables
│   ├── 📁 pain-assessment/    # Schmerz-Assessment Feature
│   ├── 📁 face-recognition/  # Gesichtserkennung Feature
│   └── 📁 settings/          # Einstellungen Feature
├── 📁 shared/                # Geteilte Komponenten & Utilities
│   ├── components/           # Wiederverwendbare UI-Komponenten
│   ├── composables/          # Geteilte Composables
│   ├── utils/                # Utility Functions
│   ├── types/                # Shared Types
│   └── constants/            # Konstanten
├── 📁 ui/                    # UI Layer
│   ├── components/           # Basis UI-Komponenten
│   ├── layouts/              # Layout-Komponenten
│   └── themes/               # Design System
└── 📁 app/                   # App-spezifische Konfiguration
    ├── router/               # Routing
    ├── stores/               # Global Stores
    └── plugins/              # Vue Plugins
```

## 🎯 Architektur-Prinzipien

### 1. **Feature-Based Organization**
- Jedes Feature ist eigenständig
- Klare Trennung zwischen Features
- Wiederverwendbare Komponenten in `shared/`

### 2. **Clean Architecture Layers**
- **Domain Layer:** Business Logic & Entities
- **Application Layer:** Use Cases & Application Services  
- **Infrastructure Layer:** External Dependencies
- **UI Layer:** Presentation & User Interface

### 3. **Dependency Inversion**
- Abstraktionen definieren, nicht Implementierungen
- Dependency Injection für Services
- Testbare Architektur

### 4. **Single Responsibility Principle**
- Jede Komponente hat eine klare Verantwortung
- Separation of Concerns
- Modulare Struktur

## 🔧 Implementierungsplan

### Phase 1: Core Structure
- [ ] Domain Layer aufbauen
- [ ] Application Services definieren
- [ ] Repository Pattern implementieren

### Phase 2: Feature Migration
- [ ] Communication Feature extrahieren
- [ ] Pain Assessment Feature strukturieren
- [ ] Face Recognition Feature isolieren

### Phase 3: UI Refactoring
- [ ] Shared Components erstellen
- [ ] Design System implementieren
- [ ] Layout-Komponenten entwickeln

### Phase 4: Testing & Documentation
- [ ] Unit Tests für Domain Logic
- [ ] Integration Tests für Services
- [ ] E2E Tests für Features

## 📊 Vorteile der neuen Architektur

### ✅ Wartbarkeit
- Klare Struktur und Verantwortlichkeiten
- Einfache Navigation und Verständnis
- Modulare Entwicklung

### ✅ Skalierbarkeit  
- Feature-basierte Organisation
- Unabhängige Entwicklung
- Wiederverwendbare Komponenten

### ✅ Testbarkeit
- Dependency Injection
- Mockbare Services
- Isolierte Unit Tests

### ✅ Teamarbeit
- Klare Code-Organisation
- Konsistente Patterns
- Bessere Entwicklererfahrung
