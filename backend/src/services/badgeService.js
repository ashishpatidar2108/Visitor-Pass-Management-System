const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const { badgesDir } = require('../config/paths');

async function generateBadge(pass, visitor) {
  fs.mkdirSync(badgesDir, { recursive: true });

  const qrData = JSON.stringify({
    token: pass.qrToken,
    visitor: visitor.name
  });
  const qrFilePath = path.join(badgesDir, `${pass.qrToken}.png`);
  const pdfFilePath = path.join(badgesDir, `${pass.qrToken}.pdf`);

  await QRCode.toFile(qrFilePath, qrData);

  const document = new PDFDocument({ size: 'A6', margin: 25 });
  document.pipe(fs.createWriteStream(pdfFilePath));
  document.fontSize(18).text('Visitor Pass', { align: 'center' }).moveDown();
  document
    .fontSize(12)
    .text(`Name: ${visitor.name}`)
    .text(`Phone: ${visitor.phone || '-'}`)
    .text(`Company: ${visitor.company || '-'}`)
    .text(`Purpose: ${visitor.purpose || '-'}`);
  document.image(qrFilePath, { fit: [130, 130], align: 'center' }).moveDown();
  document.text(`Token: ${pass.qrToken}`, { align: 'center' });
  document.end();

  return {
    qrImage: `/badges/${pass.qrToken}.png`,
    pdfPath: `/badges/${pass.qrToken}.pdf`
  };
}

module.exports = generateBadge;
