const Tesseract = require('tesseract.js');

class OCRService {
  static async scanReceipt(imageBuffer) {
    try {
      console.log('🔍 Scanning receipt...');
      
      const { data: { text } } = await Tesseract.recognize(
        imageBuffer,
        'eng',
        { logger: m => console.log(m) }
      );

      // Parse receipt text
      const receipt = this.parseReceiptText(text);
      
      return {
        success: true,
        ...receipt
      };
    } catch (error) {
      console.error('❌ OCR Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static parseReceiptText(text) {
    const lines = text.split('\n');
    
    // Extract total amount
    const totalMatch = text.match(/total[:\s]*[$]?([0-9,]+\.?\d*)/i) ||
                      text.match(/amount[:\s]*[$]?([0-9,]+\.?\d*)/i) ||
                      text.match(/grand[:\s]*[$]?([0-9,]+\.?\d*)/i);
    
    const amount = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : null;
    
    // Extract date
    const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/) ||
                     text.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    
    const date = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : null;
    
    // Extract merchant name (usually first few lines)
    const merchant = lines[0]?.trim() || 'Unknown Merchant';
    
    return {
      merchant,
      amount,
      date,
      raw_text: text.substring(0, 500) // Store first 500 chars
    };
  }
}

module.exports = OCRService;