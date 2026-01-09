import jsPDF from 'jspdf';
import type { TrendTopic } from '../services/api';

export const generateCampaignPDF = (topics: TrendTopic[], brandKeywords: string[], keyword: string) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  pdf.setFillColor(0, 102, 204);
  pdf.rect(0, 0, pageWidth, 40, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Mastercard', margin, 20);

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Trending Topics Report - ${keyword.toUpperCase()}`, margin, 30);

  let yPosition = 55;

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Brand Keywords', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);

  const keywordsPerLine = 3;
  const keywordBoxWidth = (contentWidth - 10) / keywordsPerLine;

  brandKeywords.forEach((kw, index) => {
    const col = index % keywordsPerLine;
    const row = Math.floor(index / keywordsPerLine);
    const xPos = margin + (col * keywordBoxWidth);
    const yPos = yPosition + (row * 10);

    pdf.setFillColor(220, 240, 255);
    pdf.roundedRect(xPos, yPos - 5, keywordBoxWidth - 2, 8, 2, 2, 'F');
    pdf.setTextColor(30, 64, 175);
    pdf.text(kw, xPos + 2, yPos);
  });

  const keywordRows = Math.ceil(brandKeywords.length / keywordsPerLine);
  yPosition += keywordRows * 10 + 15;

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Trending Topics', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Found ${topics.length} trending topics for analysis`, margin, yPosition);
  yPosition += 15;

  topics.forEach((topic, index) => {
    if (index > 0 || yPosition > 150) {
      pdf.addPage();
      yPosition = margin;

      pdf.setFillColor(0, 102, 204);
      pdf.rect(0, 0, pageWidth, 40, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Mastercard', margin, 20);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Trending Topics Report - ${keyword.toUpperCase()}`, margin, 30);

      yPosition = 55;
    }

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Topic ${index + 1} of ${topics.length}`, pageWidth - margin - 30, 15);

    const formattedDate = new Date(topic.publishedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    pdf.setFillColor(220, 252, 231);
    pdf.roundedRect(margin, yPosition, 40, 8, 2, 2, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(22, 163, 74);
    pdf.text(`#${topic.trend}`, margin + 2, yPosition + 5);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Published: ${formattedDate}`, margin + 45, yPosition + 5);
    yPosition += 15;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    const titleLines = pdf.splitTextToSize(topic.title, contentWidth);
    pdf.text(titleLines, margin, yPosition);
    yPosition += titleLines.length * 8 + 8;

    pdf.setFillColor(240, 249, 255);
    const descHeight = 35;
    pdf.roundedRect(margin, yPosition, contentWidth, descHeight, 3, 3, 'F');

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const descLines = pdf.splitTextToSize(topic.description, contentWidth - 10);
    pdf.text(descLines, margin + 5, yPosition + 8);
    yPosition += descHeight + 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Source URL', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(37, 99, 235);
    pdf.textWithLink(topic.url.substring(0, 80) + (topic.url.length > 80 ? '...' : ''), margin, yPosition, { url: topic.url });
    yPosition += 10;

    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, pageHeight - 10);
    pdf.text('Confidential - Mastercard Internal Use Only', pageWidth - margin - 70, pageHeight - 10);
  });

  const fileName = `Mastercard_Trends_${keyword}_${new Date().getTime()}.pdf`;
  pdf.save(fileName);
};
