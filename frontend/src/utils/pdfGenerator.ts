import jsPDF from 'jspdf';
import type { CampaignTopic } from '../services/api';

export const generateCampaignPDF = (topics: CampaignTopic[], keyword: string) => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  topics.forEach((topic, index) => {
    if (index > 0) {
      pdf.addPage();
    }

    let yPosition = margin;

    pdf.setFillColor(0, 102, 204);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Mastercard', margin, 20);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Campaign Opportunity Report - ${keyword.toUpperCase()}`, margin, 30);

    yPosition = 55;

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Page ${index + 1} of ${topics.length}`, pageWidth - margin - 30, 15);

    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${topic.category} • Trend Score: ${topic.trendScore}/100`, margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    const topicLines = pdf.splitTextToSize(topic.topic, contentWidth);
    pdf.text(topicLines, margin, yPosition);
    yPosition += topicLines.length * 8 + 5;

    pdf.setFillColor(255, 245, 230);
    pdf.roundedRect(margin, yPosition, contentWidth, 30, 3, 3, 'F');

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(230, 81, 0);
    pdf.text(topic.campaignIdea.title, margin + 5, yPosition + 8);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const descLines = pdf.splitTextToSize(topic.campaignIdea.description, contentWidth - 10);
    pdf.text(descLines, margin + 5, yPosition + 16);
    yPosition += 38;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Target Audience', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const audienceLines = pdf.splitTextToSize(topic.campaignIdea.targetAudience, contentWidth);
    pdf.text(audienceLines, margin, yPosition);
    yPosition += audienceLines.length * 5 + 8;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Key Message', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(80, 80, 80);
    const messageLines = pdf.splitTextToSize(`"${topic.campaignIdea.keyMessage}"`, contentWidth);
    pdf.text(messageLines, margin, yPosition);
    yPosition += messageLines.length * 5 + 8;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Campaign Tactics', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);

    topic.campaignIdea.tactics.forEach((tactic, tacticIndex) => {
      if (yPosition > pageHeight - 40) {
        return;
      }

      const tacticText = `${tacticIndex + 1}. ${tactic}`;
      const tacticLines = pdf.splitTextToSize(tacticText, contentWidth - 5);
      pdf.text(tacticLines, margin + 3, yPosition);
      yPosition += tacticLines.length * 5 + 2;
    });

    yPosition += 6;

    pdf.setFillColor(220, 252, 231);
    const outcomeHeight = 25;
    pdf.roundedRect(margin, yPosition, contentWidth, outcomeHeight, 3, 3, 'F');

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(21, 128, 61);
    pdf.text('Expected Outcome', margin + 5, yPosition + 7);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(22, 101, 52);
    const outcomeLines = pdf.splitTextToSize(topic.campaignIdea.expectedOutcome, contentWidth - 10);
    pdf.text(outcomeLines, margin + 5, yPosition + 14);

    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, pageHeight - 10);
    pdf.text('Confidential - Mastercard Internal Use Only', pageWidth - margin - 70, pageHeight - 10);
  });

  const fileName = `Mastercard_Campaign_${keyword}_${new Date().getTime()}.pdf`;
  pdf.save(fileName);
};
