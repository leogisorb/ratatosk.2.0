// Zentrale Grid-Konfiguration für alle Views
// Diese Datei definiert einheitliche Styles für alle Kacheln in der Anwendung

export interface GridConfig {
  tileWidth: string
  tilePadding: string
  tilePaddingVertical: string
  tileGap: string
  iconWidth: string
  iconHeight: string
  iconSize: string
  textSize: string
  borderRadius: string
  outlineWidth: string
  backgroundColor: string
  iconBackgroundColor: string
  textColor: string
  iconColor: string
  activeBackgroundColor: string
  activeIconFilter: string
  activeTextColor: string
  inactiveIconColor: string
  activeIconColor: string
}

// Haupt-Grid-Konfiguration (für HomeView, IchView, SchmerzView, UmgebungView)
export const mainGridConfig: GridConfig = {
  tileWidth: '422px',
  tilePadding: '67px',
  tilePaddingVertical: '35px',
  tileGap: '32px',
  iconWidth: '119.09px',
  iconHeight: '125px',
  iconSize: '125px',
  textSize: '40px',
  borderRadius: '10px',
  outlineWidth: '1.50px',
  backgroundColor: 'rgba(217,217,217,0.10)',
  iconBackgroundColor: '',
  textColor: 'black',
  iconColor: '#00796B',
  activeBackgroundColor: '#00796B',
  activeIconFilter: 'brightness(0) invert(1)',
  activeTextColor: 'white',
  inactiveIconColor: '#00796B',
  activeIconColor: 'white'
}

// Keyboard-Grid-Konfiguration (für GefuehleView, HygieneView, KleidungView, BewegungView, Schmerz-Views)
export const keyboardGridConfig: GridConfig = {
  tileWidth: 'auto',
  tilePadding: '12.6px 18.9px',
  tilePaddingVertical: '12.6px',
  tileGap: '24px',
  iconWidth: 'auto',
  iconHeight: 'auto',
  iconSize: 'auto',
  textSize: '2.646rem',
  borderRadius: '15px',
  outlineWidth: '2px',
  backgroundColor: 'white',
  iconBackgroundColor: '',
  textColor: 'black',
  iconColor: '#00796B',
  activeBackgroundColor: '#f3f4f6',
  activeIconFilter: 'none',
  activeTextColor: 'orange',
  inactiveIconColor: '#00796B',
  activeIconColor: '#00796B'
}

// Style-Funktionen für Haupt-Grid
export const getTileStyle = (index: number, currentTileIndex: number, isDarkMode: boolean, config: GridConfig) => {
  const isActive = currentTileIndex === index
  return {
    width: config.tileWidth,
    padding: `${config.tilePaddingVertical} ${config.tilePadding}`,
    backgroundColor: isActive ? config.activeBackgroundColor : (isDarkMode ? 'rgba(55,65,81,0.3)' : config.backgroundColor),
    borderRadius: config.borderRadius,
    outline: `${config.outlineWidth} ${isDarkMode ? 'white' : 'black'} solid`,
    outlineOffset: `-${config.outlineWidth}`,
    gap: '26px'
  }
}

export const getIconStyle = (index: number, currentTileIndex: number, isDarkMode: boolean, config: GridConfig) => {
  const isActive = currentTileIndex === index
  
  // Für SVG-Icons in <img> Tags: Filter verwenden um Farbe zu ändern
  let iconFilter = 'none'
  if (isActive) {
    iconFilter = config.activeIconFilter
  } else {
    // Inaktive Icons: Filter um sie grün (#00796B) zu machen
    iconFilter = 'brightness(0) saturate(0%) invert(07%) sepia(0%) saturate(0%) hue-rotate(346deg) brightness(104%) contrast(97%)'
  }
  
  return {
    width: config.iconSize,
    height: config.iconSize,
    filter: iconFilter,
    // Icon-Farbe zentral steuern
    color: isActive ? config.activeIconColor : config.inactiveIconColor
  }
}

export const getTextStyle = (index: number, currentTileIndex: number, isDarkMode: boolean, config: GridConfig) => {
  const isActive = currentTileIndex === index
  return {
    color: isActive ? config.activeTextColor : (isDarkMode ? 'white' : config.textColor),
    fontSize: config.textSize
  }
}

// Style-Funktionen für Keyboard-Grid
export const getKeyboardTileStyle = (index: number, currentTileIndex: number, config: GridConfig) => {
  const isActive = currentTileIndex === index
  return {
    fontSize: config.textSize,
    background: isActive ? config.activeBackgroundColor : config.backgroundColor,
    border: `${config.outlineWidth} solid #d1d5db`,
    borderRadius: config.borderRadius,
    outline: 'none',
    boxShadow: 'none',
    padding: config.tilePadding,
    margin: '0'
  }
}

// Zentrale Icon-Farben für alle Views
export const getIconColor = (isActive: boolean = false, isDarkMode: boolean = false) => {
  if (isActive) {
    return '#00796B' // Aktive Icons immer grün
  }
  return '#00796B' // Inaktive Icons auch grün (einheitlich)
}

// Zentrale Text-Farben für alle Views
export const getTextColor = (isActive: boolean = false, isDarkMode: boolean = false) => {
  if (isActive) {
    return isDarkMode ? 'white' : '#00796B' // Aktive Texte grün oder weiß
  }
  return isDarkMode ? 'white' : 'black' // Inaktive Texte schwarz oder weiß
}
