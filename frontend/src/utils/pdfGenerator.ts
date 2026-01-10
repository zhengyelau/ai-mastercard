import { jsPDF } from 'jspdf';
import type { TrendTopic } from '../services/api';

export const generateCampaignPDF = (topics: TrendTopic[], totalTopics: number, keyword: string) => {
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
  pdf.text(`${totalTopics} trending topics identified from latest coverage`, margin + 5, yPosition + 15);

  yPosition += 30;

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Detailed Analysis', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`${topics.length} topics selected for detailed review`, margin, yPosition);
  yPosition += 15;

  topics.forEach((topic, index) => {
    if (yPosition > 240) {
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
    pdf.text(`Topic ${index + 1} of ${topics.length}`, pageWidth - margin - 30, margin);

    pdf.setFillColor(220, 252, 231);
    pdf.roundedRect(margin, yPosition, contentWidth, 10, 2, 2, 'F');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(22, 163, 74);
    pdf.text(`Trending Score: ${topic.trending_score.toFixed(1)}%`, margin + 2, yPosition + 6);
    yPosition += 15;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    const titleLines = pdf.splitTextToSize(topic.topic_name, contentWidth);
    pdf.text(titleLines, margin, yPosition);
    yPosition += titleLines.length * 6 + 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Why It\'s Trending', margin, yPosition);
    yPosition += 5;

    pdf.setFillColor(230, 244, 255);
    const whyLines = pdf.splitTextToSize(topic.analysis.trend_analysis.why_trending, contentWidth - 10);
    const whyHeight = whyLines.length * 5 + 8;
    pdf.roundedRect(margin, yPosition, contentWidth, whyHeight, 2, 2, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(40, 40, 40);
    pdf.text(whyLines, margin + 5, yPosition + 5);
    yPosition += whyHeight + 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Campaign Opportunity', margin, yPosition);
    yPosition += 5;

    const campaign = topic.analysis.campaign_opportunities[0];
    if (campaign) {
      pdf.setFillColor(230, 255, 240);
      const campaignLines = pdf.splitTextToSize(campaign.campaign_concept, contentWidth - 10);
      const campaignHeight = campaignLines.length * 5 + 12;
      pdf.roundedRect(margin, yPosition, contentWidth, campaignHeight, 2, 2, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(22, 100, 50);
      pdf.text(campaign.campaign_name, margin + 5, yPosition + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(40, 40, 40);
      pdf.text(campaignLines, margin + 5, yPosition + 10);
      yPosition += campaignHeight + 8;
    }

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Risk Assessment', margin, yPosition);
    yPosition += 5;

    pdf.setFillColor(255, 245, 230);
    const riskLines = pdf.splitTextToSize(topic.analysis.risk_assessment.potential_risks, contentWidth - 10);
    const riskHeight = riskLines.length * 5 + 8;
    pdf.roundedRect(margin, yPosition, contentWidth, riskHeight, 2, 2, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(40, 40, 40);
    pdf.text(riskLines, margin + 5, yPosition + 5);
    yPosition += riskHeight + 12;

    if (topic.recent_coverage.length > 0) {
      const article = topic.recent_coverage[0];
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Featured Article:', margin, yPosition);
      yPosition += 4;

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      const articleTitle = pdf.splitTextToSize(article.title, contentWidth - 5);
      pdf.text(articleTitle.slice(0, 1), margin + 2, yPosition);
      yPosition += 4;

      const articleDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      pdf.text(`${article.source} • ${articleDate}`, margin + 2, yPosition);
      yPosition += 8;
    }
  });

  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, pageHeight - 10);
  pdf.text('Confidential - Mastercard Internal Use Only', pageWidth - margin - 70, pageHeight - 10);

  const fileName = `Mastercard_Trends_${keyword}_${new Date().getTime()}.pdf`;
  pdf.save(fileName);
};
