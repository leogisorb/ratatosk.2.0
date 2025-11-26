/**
 * PDFGenerator - Generiert PDF-Protokolle aus ProtocolLogger-Einträgen
 */

import jsPDF from 'jspdf'
import { protocolLogger, type ProtocolEntry } from '../services/ProtocolLogger'

/**
 * Formatiert einen Timestamp zu einem lesbaren Datum/Zeit-String
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * Generiert eine PDF aus allen ProtocolLogger-Einträgen
 */
export function generateProtocolPDF(): void {
  const entries = protocolLogger.getEntries()
  
  if (entries.length === 0) {
    alert('Keine Protokolleinträge vorhanden.')
    return
  }

  // Erstelle PDF-Dokument
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const lineHeight = 7
  let yPosition = margin

  // Titel
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('RATATOSK - Protokoll', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += lineHeight * 2

  // Erstellungsdatum
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Erstellt am: ${new Date().toLocaleString('de-DE')}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  )
  yPosition += lineHeight * 2

  // Statistik
  const confirmationCount = entries.filter(e => e.type === 'confirmation').length
  const warningCount = entries.filter(e => e.type === 'warning').length
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Statistik', margin, yPosition)
  yPosition += lineHeight
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Gesamt: ${entries.length} Einträge`, margin + 5, yPosition)
  yPosition += lineHeight
  doc.text(`Confirmation-Texte: ${confirmationCount}`, margin + 5, yPosition)
  yPosition += lineHeight
  doc.text(`Warngeräusche: ${warningCount}`, margin + 5, yPosition)
  yPosition += lineHeight * 2

  // Einträge
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Protokolleinträge', margin, yPosition)
  yPosition += lineHeight * 1.5

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  entries.forEach((entry, index) => {
    // Prüfe ob neue Seite nötig
    if (yPosition > pageHeight - margin - lineHeight * 3) {
      doc.addPage()
      yPosition = margin
    }

    // Typ-Badge
    doc.setFont('helvetica', 'bold')
    const typeText = entry.type === 'confirmation' ? 'CONFIRMATION' : 'WARNING'
    const typeColor = entry.type === 'confirmation' ? [0, 100, 200] : [200, 0, 0]
    doc.setTextColor(typeColor[0], typeColor[1], typeColor[2])
    doc.text(`[${typeText}]`, margin, yPosition)
    
    // Timestamp
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    const timestampText = formatTimestamp(entry.timestamp)
    const timestampWidth = doc.getTextWidth(timestampText)
    doc.text(timestampText, pageWidth - margin - timestampWidth, yPosition)
    yPosition += lineHeight

    // Text
    doc.setTextColor(0, 0, 0)
    const textLines = doc.splitTextToSize(entry.text, pageWidth - margin * 2) as string[]
    textLines.forEach((line: string) => {
      if (yPosition > pageHeight - margin - lineHeight) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(line, margin + 5, yPosition)
      yPosition += lineHeight
    })

    // Dialog-Name (falls vorhanden)
    if (entry.dialogName) {
      doc.setTextColor(150, 150, 150)
      doc.setFontSize(8)
      doc.text(`Dialog: ${entry.dialogName}`, margin + 5, yPosition)
      yPosition += lineHeight
      doc.setFontSize(10)
    }

    // Abstand zwischen Einträgen
    yPosition += lineHeight * 0.5
  })

  // Speichere PDF
  const fileName = `ratatosk-protokoll-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
  
  console.log('PDF generated:', fileName, 'with', entries.length, 'entries')
}

