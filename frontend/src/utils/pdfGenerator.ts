import { jsPDF } from 'jspdf';
import type { TrendTopic } from '../services/api';

export const generateCampaignPDF = (topics: TrendTopic[], articleCount: number, keyword: string) => {
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

  pdf.setFillColor(240, 249, 255);
  pdf.roundedRect(margin, yPosition, contentWidth, 20, 3, 3, 'F');

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Analysis Overview', margin + 5, yPosition + 8);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.text(`${articleCount} articles analyzed to identify trending topics`, margin + 5, yPosition + 15);

  yPosition += 30;

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

    pdf.setFillColor(220, 252, 231);
    pdf.roundedRect(margin, yPosition, 50, 8, 2, 2, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(22, 163, 74);
    pdf.text(`#${topic.trend}`, margin + 2, yPosition + 5);
    yPosition += 15;

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    const titleLines = pdf.splitTextToSize(topic.trend, contentWidth);
    pdf.text(titleLines, margin, yPosition);
    yPosition += titleLines.length * 8 + 10;

    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(margin, yPosition, contentWidth, 18, 3, 3, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80, 80, 80);
    pdf.text('Source Article', margin + 5, yPosition + 6);

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const cleanTitle = topic.article_sample.title.replace(' - PR Newswire', '').replace(/- [A-Za-z\s]+$/, '');
    const articleTitleLines = pdf.splitTextToSize(cleanTitle, contentWidth - 10);
    pdf.text(articleTitleLines.slice(0, 1), margin + 5, yPosition + 11);

    const articleDate = new Date(topic.article_sample.publishedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    pdf.text(`Published: ${articleDate}`, margin + 5, yPosition + 15);
    yPosition += 25;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Why It Matters', margin, yPosition);
    yPosition += 6;

    pdf.setFillColor(255, 251, 235);
    const whyMattersLines = pdf.splitTextToSize(topic.why_it_matters, contentWidth - 10);
    const whyMattersHeight = whyMattersLines.length * 6 + 10;
    pdf.roundedRect(margin, yPosition, contentWidth, whyMattersHeight, 3, 3, 'F');

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    pdf.text(whyMattersLines, margin + 5, yPosition + 8);
    yPosition += whyMattersHeight + 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Mastercard Campaign Idea', margin, yPosition);
    yPosition += 6;

    pdf.setFillColor(240, 249, 255);
    const campaignLines = pdf.splitTextToSize(topic.mastercard_campaign_idea, contentWidth - 10);
    const campaignHeight = campaignLines.length * 6 + 10;
    pdf.roundedRect(margin, yPosition, contentWidth, campaignHeight, 3, 3, 'F');

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    pdf.text(campaignLines, margin + 5, yPosition + 8);
    yPosition += campaignHeight + 10;

    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, pageHeight - 10);
    pdf.text('Confidential - Mastercard Internal Use Only', pageWidth - margin - 70, pageHeight - 10);
  });

  const fileName = `Mastercard_Trends_${keyword}_${new Date().getTime()}.pdf`;
  pdf.save(fileName);
};
