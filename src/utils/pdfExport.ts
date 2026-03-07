import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LocationData {
  name: string;
  temperature: number;
  ndvi: number;
  ndbi: number;
  hotspots: number;
}

interface ComparisonData {
  location1: LocationData | null;
  location2: LocationData | null;
}

interface ExportOptions {
  title?: string;
  viewLevel: 'states' | 'districts';
  temperatureFilter?: [number, number];
  selectedLocation?: string | null;
  comparison?: ComparisonData;
}

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
    lastAutoTable: { finalY: number };
  }
}

export function generateAnalysisPDF(data: LocationData[], options: ExportOptions): void {
  const {
    title = 'Urban Heat Island Analysis Report',
    viewLevel,
    temperatureFilter = [20, 45],
    selectedLocation,
    comparison
  } = options;

  // Check if comparison is active
  const hasComparison = comparison?.location1 && comparison?.location2;

  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper to draw colored rectangle
  const drawColoredRect = (x: number, y: number, w: number, h: number, color: string) => {
    const rgb = hexToRgb(color);
    if (rgb) {
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(x, y, w, h, 'F');
    }
  };

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Get temperature color
  const getTempColor = (temp: number): string => {
    if (temp < 28) return '#14b8a6';
    if (temp < 30) return '#22c55e';
    if (temp < 32) return '#eab308';
    if (temp < 34) return '#f97316';
    if (temp < 36) return '#ef4444';
    return '#991b1b';
  };

  // Calculate statistics
  const temps = data.map(d => d.temperature).filter(t => t > 0);
  const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
  const minTemp = temps.length > 0 ? Math.min(...temps) : 0;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 0;
  const stdDev = temps.length > 0
    ? Math.sqrt(temps.reduce((sum, t) => sum + Math.pow(t - avgTemp, 2), 0) / temps.length)
    : 0;

  const sortedByTemp = [...data].filter(d => d.temperature > 0).sort((a, b) => b.temperature - a.temperature);
  const hottestLocations = sortedByTemp.slice(0, 10);
  const coolestLocations = sortedByTemp.slice(-10).reverse();

  const sortedByNDVI = [...data].filter(d => d.ndvi > 0).sort((a, b) => b.ndvi - a.ndvi);
  const greenestLocations = sortedByNDVI.slice(0, 10);

  const totalHotspots = data.reduce((sum, d) => sum + (d.hotspots || 0), 0);

  // Risk distribution
  const riskDistribution = {
    critical: data.filter(d => d.temperature >= 38).length,
    high: data.filter(d => d.temperature >= 34 && d.temperature < 38).length,
    medium: data.filter(d => d.temperature >= 30 && d.temperature < 34).length,
    low: data.filter(d => d.temperature > 0 && d.temperature < 30).length,
  };

  // ========== HEADER ==========
  // Header background
  drawColoredRect(0, 0, pageWidth, 45, '#1e293b');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, 20);

  // Subtitle
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Malaysia ${viewLevel === 'states' ? 'States' : 'Districts'} Analysis`, margin, 28);

  // Date and filter info
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, margin, 36);

  doc.text(`Temperature Filter: ${temperatureFilter[0]}°C - ${temperatureFilter[1]}°C`, pageWidth - margin - 50, 36);

  yPos = 55;

  // ========== EXECUTIVE SUMMARY ==========
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const summaryText = `This report analyzes ${data.length} ${viewLevel} across Malaysia for Urban Heat Island (UHI) effects. ` +
    `The average land surface temperature is ${avgTemp.toFixed(1)}°C, with temperatures ranging from ${minTemp.toFixed(1)}°C to ${maxTemp.toFixed(1)}°C. ` +
    `${riskDistribution.critical + riskDistribution.high} locations are classified as high-risk heat zones requiring immediate attention.`;

  const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 2 * margin);
  doc.text(splitSummary, margin, yPos);
  yPos += splitSummary.length * 5 + 10;

  // ========== KEY STATISTICS ==========
  checkPageBreak(50);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Statistics', margin, yPos);
  yPos += 8;

  // Stats boxes
  const statsData = [
    { label: 'Average Temp', value: `${avgTemp.toFixed(1)}°C`, color: '#f97316' },
    { label: 'Highest Temp', value: `${maxTemp.toFixed(1)}°C`, color: '#ef4444' },
    { label: 'Lowest Temp', value: `${minTemp.toFixed(1)}°C`, color: '#14b8a6' },
    { label: 'Std Deviation', value: `${stdDev.toFixed(2)}°C`, color: '#8b5cf6' },
    { label: 'Total Locations', value: `${data.length}`, color: '#3b82f6' },
    { label: 'Heat Hotspots', value: `${totalHotspots.toLocaleString()}`, color: '#ef4444' },
  ];

  const boxWidth = (pageWidth - 2 * margin - 10) / 3;
  const boxHeight = 20;

  statsData.forEach((stat, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = margin + col * (boxWidth + 5);
    const y = yPos + row * (boxHeight + 5);

    // Box background
    drawColoredRect(x, y, boxWidth, boxHeight, '#f1f5f9');

    // Color accent
    drawColoredRect(x, y, 3, boxHeight, stat.color);

    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(stat.label, x + 6, y + 7);

    // Value
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(stat.value, x + 6, y + 16);
  });

  yPos += Math.ceil(statsData.length / 3) * (boxHeight + 5) + 15;

  // ========== COMPARISON ANALYSIS (if enabled) - PLACED AT TOP ==========
  if (hasComparison && comparison?.location1 && comparison?.location2) {
    const loc1 = comparison.location1;
    const loc2 = comparison.location2;

    checkPageBreak(120);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Location Comparison Analysis', margin, yPos);
    yPos += 8;

    // Comparison header with location names
    doc.setFillColor(139, 92, 246); // Purple
    doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${loc1.name}  vs  ${loc2.name}`, pageWidth / 2, yPos + 8, { align: 'center' });
    yPos += 18;

    // Comparison metrics table
    const tempDiff = loc1.temperature - loc2.temperature;
    const ndviDiff = loc1.ndvi - loc2.ndvi;
    const ndbiDiff = loc1.ndbi - loc2.ndbi;
    const hotspotDiff = loc1.hotspots - loc2.hotspots;

    const getBetterLabel = (diff: number, higherIsBetter: boolean) => {
      if (diff === 0) return 'Equal';
      if (higherIsBetter) {
        return diff > 0 ? loc1.name : loc2.name;
      } else {
        return diff < 0 ? loc1.name : loc2.name;
      }
    };

    const comparisonMetrics = [
      {
        metric: 'Temperature',
        loc1Value: `${loc1.temperature.toFixed(1)}°C`,
        loc2Value: `${loc2.temperature.toFixed(1)}°C`,
        difference: `${tempDiff > 0 ? '+' : ''}${tempDiff.toFixed(1)}°C`,
        better: getBetterLabel(tempDiff, false),
        analysis: tempDiff === 0 ? 'Both locations have the same temperature' :
          Math.abs(tempDiff) < 1 ? 'Minimal temperature difference' :
          Math.abs(tempDiff) < 3 ? 'Moderate temperature difference' :
          'Significant temperature difference'
      },
      {
        metric: 'Vegetation (NDVI)',
        loc1Value: loc1.ndvi.toFixed(3),
        loc2Value: loc2.ndvi.toFixed(3),
        difference: `${ndviDiff > 0 ? '+' : ''}${ndviDiff.toFixed(3)}`,
        better: getBetterLabel(ndviDiff, true),
        analysis: ndviDiff === 0 ? 'Same vegetation coverage' :
          Math.abs(ndviDiff) < 0.05 ? 'Similar vegetation levels' :
          Math.abs(ndviDiff) < 0.15 ? 'Notable vegetation difference' :
          'Major vegetation difference'
      },
      {
        metric: 'Urban Density (NDBI)',
        loc1Value: loc1.ndbi.toFixed(3),
        loc2Value: loc2.ndbi.toFixed(3),
        difference: `${ndbiDiff > 0 ? '+' : ''}${ndbiDiff.toFixed(3)}`,
        better: getBetterLabel(ndbiDiff, false),
        analysis: ndbiDiff === 0 ? 'Same urban density' :
          Math.abs(ndbiDiff) < 0.05 ? 'Similar urbanization levels' :
          Math.abs(ndbiDiff) < 0.15 ? 'Notable urbanization difference' :
          'Major urbanization difference'
      },
      {
        metric: 'Heat Hotspots',
        loc1Value: loc1.hotspots.toString(),
        loc2Value: loc2.hotspots.toString(),
        difference: `${hotspotDiff > 0 ? '+' : ''}${hotspotDiff}`,
        better: getBetterLabel(hotspotDiff, false),
        analysis: hotspotDiff === 0 ? 'Same number of hotspots' :
          Math.abs(hotspotDiff) < 10 ? 'Similar hotspot count' :
          Math.abs(hotspotDiff) < 50 ? 'Notable hotspot difference' :
          'Major hotspot difference'
      }
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', loc1.name, loc2.name, 'Difference', 'Better Location', 'Analysis']],
      body: comparisonMetrics.map(m => [
        m.metric,
        m.loc1Value,
        m.loc2Value,
        m.difference,
        m.better,
        m.analysis
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 30 },
        5: { cellWidth: 45 },
      },
      didParseCell: (data) => {
        // Highlight the "Better Location" column
        if (data.section === 'body' && data.column.index === 4) {
          const value = data.cell.raw as string;
          if (value === loc1.name) {
            data.cell.styles.textColor = [34, 197, 94]; // Green
            data.cell.styles.fontStyle = 'bold';
          } else if (value === loc2.name) {
            data.cell.styles.textColor = [59, 130, 246]; // Blue
            data.cell.styles.fontStyle = 'bold';
          }
        }
        // Color the difference column
        if (data.section === 'body' && data.column.index === 3) {
          const value = data.cell.raw as string;
          if (value.startsWith('+')) {
            data.cell.styles.textColor = [239, 68, 68]; // Red for positive
          } else if (value.startsWith('-')) {
            data.cell.styles.textColor = [34, 197, 94]; // Green for negative
          }
        }
      },
      margin: { left: margin, right: margin },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Summary box
    checkPageBreak(40);
    drawColoredRect(margin, yPos, pageWidth - 2 * margin, 30, '#f1f5f9');
    drawColoredRect(margin, yPos, 4, 30, '#8b5cf6');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', margin + 8, yPos + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    let summaryText = '';
    if (tempDiff < 0) {
      summaryText = `${loc1.name} is ${Math.abs(tempDiff).toFixed(1)}°C cooler than ${loc2.name}. `;
    } else if (tempDiff > 0) {
      summaryText = `${loc2.name} is ${Math.abs(tempDiff).toFixed(1)}°C cooler than ${loc1.name}. `;
    } else {
      summaryText = `Both locations have the same temperature. `;
    }

    if (ndviDiff > 0) {
      summaryText += `${loc1.name} has more vegetation (NDVI ${loc1.ndvi.toFixed(2)} vs ${loc2.ndvi.toFixed(2)}). `;
    } else if (ndviDiff < 0) {
      summaryText += `${loc2.name} has more vegetation (NDVI ${loc2.ndvi.toFixed(2)} vs ${loc1.ndvi.toFixed(2)}). `;
    }

    const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 2 * margin - 16);
    doc.text(splitSummary, margin + 8, yPos + 16);

    yPos += 40;
  }

  // ========== RISK DISTRIBUTION ==========
  checkPageBreak(50);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Distribution', margin, yPos);
  yPos += 8;

  const riskData = [
    { level: 'Critical (≥38°C)', count: riskDistribution.critical, color: '#ef4444', percentage: ((riskDistribution.critical / data.length) * 100).toFixed(1) },
    { level: 'High (34-38°C)', count: riskDistribution.high, color: '#f97316', percentage: ((riskDistribution.high / data.length) * 100).toFixed(1) },
    { level: 'Medium (30-34°C)', count: riskDistribution.medium, color: '#eab308', percentage: ((riskDistribution.medium / data.length) * 100).toFixed(1) },
    { level: 'Low (<30°C)', count: riskDistribution.low, color: '#22c55e', percentage: ((riskDistribution.low / data.length) * 100).toFixed(1) },
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Risk Level', 'Count', 'Percentage', 'Visual']],
    body: riskData.map(r => [r.level, r.count.toString(), `${r.percentage}%`, '']),
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 60 },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const risk = riskData[data.row.index];
        const barWidth = (parseFloat(risk.percentage) / 100) * 55;
        const rgb = hexToRgb(risk.color);
        if (rgb) {
          doc.setFillColor(rgb.r, rgb.g, rgb.b);
          doc.rect(data.cell.x + 2, data.cell.y + 3, barWidth, 6, 'F');
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ========== TOP 10 HOTTEST LOCATIONS ==========
  checkPageBreak(60);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Top 10 Hottest Locations', margin, yPos);
  yPos += 3;

  autoTable(doc, {
    startY: yPos,
    head: [['Rank', 'Location', 'Temperature', 'NDVI', 'NDBI', 'Hotspots']],
    body: hottestLocations.map((loc, i) => [
      (i + 1).toString(),
      loc.name,
      `${loc.temperature.toFixed(1)}°C`,
      loc.ndvi.toFixed(3),
      loc.ndbi.toFixed(3),
      loc.hotspots.toString(),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ========== TOP 10 COOLEST LOCATIONS ==========
  checkPageBreak(60);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Top 10 Coolest Locations', margin, yPos);
  yPos += 3;

  autoTable(doc, {
    startY: yPos,
    head: [['Rank', 'Location', 'Temperature', 'NDVI', 'NDBI', 'Hotspots']],
    body: coolestLocations.map((loc, i) => [
      (i + 1).toString(),
      loc.name,
      `${loc.temperature.toFixed(1)}°C`,
      loc.ndvi.toFixed(3),
      loc.ndbi.toFixed(3),
      loc.hotspots.toString(),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ========== TOP 10 GREENEST LOCATIONS ==========
  checkPageBreak(60);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Top 10 Greenest Locations (Highest NDVI)', margin, yPos);
  yPos += 3;

  autoTable(doc, {
    startY: yPos,
    head: [['Rank', 'Location', 'NDVI', 'Temperature', 'NDBI']],
    body: greenestLocations.map((loc, i) => [
      (i + 1).toString(),
      loc.name,
      loc.ndvi.toFixed(3),
      `${loc.temperature.toFixed(1)}°C`,
      loc.ndbi.toFixed(3),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ========== FULL DATA TABLE ==========
  doc.addPage();
  yPos = margin;

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Complete Data Table', margin, yPos);
  yPos += 3;

  // Sort all data by temperature descending
  const sortedData = [...data].sort((a, b) => b.temperature - a.temperature);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Location', 'Temp (°C)', 'NDVI', 'NDBI', 'Hotspots', 'Risk Level']],
    body: sortedData.map((loc, i) => {
      let riskLevel = 'Low';
      if (loc.temperature >= 38) riskLevel = 'Critical';
      else if (loc.temperature >= 34) riskLevel = 'High';
      else if (loc.temperature >= 30) riskLevel = 'Medium';

      return [
        (i + 1).toString(),
        loc.name,
        loc.temperature.toFixed(1),
        loc.ndvi.toFixed(3),
        loc.ndbi.toFixed(3),
        loc.hotspots.toString(),
        riskLevel,
      ];
    }),
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 25, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const risk = data.cell.raw as string;
        if (risk === 'Critical') {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = 'bold';
        } else if (risk === 'High') {
          data.cell.styles.textColor = [249, 115, 22];
          data.cell.styles.fontStyle = 'bold';
        } else if (risk === 'Medium') {
          data.cell.styles.textColor = [234, 179, 8];
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  // ========== FOOTER ON ALL PAGES ==========
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Urban Heat Island Analysis Report | Malaysia', margin, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
  }

  // Save the PDF
  const filename = `UHI_Analysis_${viewLevel}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
