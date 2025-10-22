// Centralized data for ich-dialog system
// Based on pain assessment structure but adapted for ich-standalone content

// Main regions for ich-standalone
export const mainRegions = [
  { id: 'kleidung', title: 'Kleidung', icon: '/kleidung.svg' },
  { id: 'gefuehle', title: 'Gefühle', icon: '/gefuehle.svg' },
  { id: 'hygiene', title: 'Hygiene', icon: '/hygiene.svg' },
  { id: 'bewegung', title: 'Bewegung', icon: '/bewegung.svg' },
  { id: 'ernaehrung', title: 'Ernährung', icon: '/ernaehrung.svg' },
  { id: 'zurueck', title: 'Zurück', icon: '/zurueck.svg' }
]

// Sub-regions for Kleidung
export const kleidungSubRegions = [
  { id: 'oberteil', title: 'Oberteil', icon: '/oberteil.svg' },
  { id: 'hose', title: 'Hose', icon: '/hose.svg' },
  { id: 'schuhe', title: 'Schuhe', icon: '/schuhe.svg' },
  { id: 'unterwaesche', title: 'Unterwäsche', icon: '/unterwaesche.svg' },
  { id: 'jacke', title: 'Jacke', icon: '/jacke.svg' },
  { id: 'accessoires', title: 'Accessoires', icon: '/accessoires.svg' },
  { id: 'zurueck', title: 'Zurück', icon: '/back.svg' }
]

// Sub-regions for Gefühle
export const gefuehleSubRegions = [
  { id: 'gluecklich', title: 'Glücklich', icon: '/gluecklich.svg' },
  { id: 'traurig', title: 'Traurig', icon: '/traurig.svg' },
  { id: 'wuetend', title: 'Wütend', icon: '/wuetend.svg' },
  { id: 'aengstlich', title: 'Ängstlich', icon: '/aengstlich.svg' },
  { id: 'entspannt', title: 'Entspannt', icon: '/entspannt.svg' },
  { id: 'aufgeregt', title: 'Aufgeregt', icon: '/aufgeregt.svg' },
  { id: 'zurueck', title: 'Zurück', icon: '/back.svg' }
]

// Sub-regions for Hygiene
export const hygieneSubRegions = [
  { id: 'koerperpflege', title: 'Körperpflege', icon: '/koerperpflege.svg' },
  { id: 'haare', title: 'Haare', icon: '/haare.svg' },
  { id: 'zaehne', title: 'Zähne', icon: '/zaehne.svg' },
  { id: 'haende', title: 'Hände', icon: '/haende.svg' },
  { id: 'koerper', title: 'Körper', icon: '/koerper.svg' },
  { id: 'zurueck', title: 'Zurück', icon: '/back.svg' }
]

// Sub-regions for Bewegung
export const bewegungSubRegions = [
  { id: 'spazieren', title: 'Spazieren', icon: '/spazieren.svg' },
  { id: 'laufen', title: 'Laufen', icon: '/laufen.svg' },
  { id: 'radfahren', title: 'Radfahren', icon: '/radfahren.svg' },
  { id: 'schwimmen', title: 'Schwimmen', icon: '/schwimmen.svg' },
  { id: 'sport', title: 'Sport', icon: '/sport.svg' },
  { id: 'zurueck', title: 'Zurück', icon: '/back.svg' }
]

// Sub-regions for Ernährung
export const ernaehrungSubRegions = [
  { id: 'fruehstueck', title: 'Frühstück', icon: '/fruehstueck.svg' },
  { id: 'mittagessen', title: 'Mittagessen', icon: '/mittagessen.svg' },
  { id: 'abendessen', title: 'Abendessen', icon: '/abendessen.svg' },
  { id: 'snacks', title: 'Snacks', icon: '/snacks.svg' },
  { id: 'getraenke', title: 'Getränke', icon: '/getraenke.svg' },
  { id: 'zurueck', title: 'Zurück', icon: '/back.svg' }
]

// Helper function to get all sub-regions
export const getAllSubRegions = () => [
  ...kleidungSubRegions,
  ...gefuehleSubRegions,
  ...hygieneSubRegions,
  ...bewegungSubRegions,
  ...ernaehrungSubRegions
]

// Helper function to get sub-regions by main region
export const getSubRegionsByMainRegion = (mainRegionId: string) => {
  switch (mainRegionId) {
    case 'kleidung':
      return kleidungSubRegions
    case 'gefuehle':
      return gefuehleSubRegions
    case 'hygiene':
      return hygieneSubRegions
    case 'bewegung':
      return bewegungSubRegions
    case 'ernaehrung':
      return ernaehrungSubRegions
    default:
      return []
  }
}
