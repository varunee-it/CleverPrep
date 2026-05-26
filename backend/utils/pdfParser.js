import fs from 'fs';
import { getDocumentProxy, extractText, getMeta } from 'unpdf';

export const extractTextFromPDF = async (filePath) => {
  try {
    // 1. Read file using fs.readFileSync
    const dataBuffer = fs.readFileSync(filePath);
    
    // 2. Use Uint8Array for PDF data and create PDF proxy
    const pdf = await getDocumentProxy(new Uint8Array(dataBuffer));
    
    // 3. Extract text
    const { text, totalPages } = await extractText(pdf, { mergePages: true });
    
    // 4. Extract metadata info
    const { info } = await getMeta(pdf);

    // 5. Return the exact same structure to ensure controllers don't break
    return {
      text: text || "",
      numPages: totalPages || 0,
      info: info || {}
    };
  } catch (error) {
    // 6. Log PDF parsing errors and throw
    console.error('Error extracting text from PDF:', error);
    throw new Error("Error extracting text from PDF");
  }
};