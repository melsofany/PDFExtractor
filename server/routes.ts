import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import type { ExtractedData, Committee, Voter } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // POST /api/process-pdf - Process uploaded PDF and extract electoral committee data
  app.post("/api/process-pdf", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "لم يتم رفع ملف" });
      }

      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({ error: "يجب أن يكون الملف من نوع PDF" });
      }

      // Parse PDF using pdf-parse v2.x API
      const pdfParseModule = await import("pdf-parse");
      const { PDFParse } = pdfParseModule;
      
      const parser = new PDFParse({ data: req.file.buffer });
      const result = await parser.getText();
      await parser.destroy();
      
      const text = result.text || '';
      const numPages = result.total || 0;

      // Extract committees and voters from PDF text
      const extractedData = extractElectoralData(text, numPages);

      res.json(extractedData);
    } catch (error) {
      console.error("Error processing PDF:", error);
      res.status(500).json({ 
        error: "حدث خطأ أثناء معالجة الملف",
        details: error instanceof Error ? error.message : "خطأ غير معروف"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

/**
 * Extract electoral committee data from PDF text
 * This is a sophisticated parser for Arabic electoral PDFs
 */
function extractElectoralData(text: string, totalPages: number): ExtractedData {
  const committees: Committee[] = [];
  
  // Split text into pages (approximate based on page breaks)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentCommittee: Committee | null = null;
  let currentVoters: Voter[] = [];
  let committeeInfo: { name: string; subNumber: string } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect committee header - "كشف بأسماء الناخبين باللجنة الفرعية رقم"
    if (line.includes('كشف بأسماء الناخبين') || line.includes('اللجنة الفرعية')) {
      // Save previous committee if exists
      if (currentCommittee && currentVoters.length > 0) {
        currentCommittee.voters = currentVoters;
        committees.push(currentCommittee);
      }
      
      // Look ahead for school name, address, and sub-number
      let committeeName = '';
      let address = '';
      let subNumber = '000';
      
      // Next few lines should contain school name, address, and number
      for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
        const nextLine = lines[j];
        
        // Check for committee name - first line containing school/center/institute
        if (!committeeName) {
          // Look for lines containing institution names
          if (nextLine.includes('مدرسة') || nextLine.includes('معهد') || 
              nextLine.includes('مركز شباب') || nextLine.includes('الوحدة الصحية') ||
              nextLine.includes('المدرسة') || nextLine.includes('المعهد')) {
            committeeName = nextLine.trim();
          }
        }
        
        // Check for address (العنوان) - usually contains "شارع" or "وعنوانها"
        if ((nextLine.includes('شارع') || nextLine.includes('وعنوانها') || 
             nextLine.includes('عنوان') || nextLine.includes('طريق')) && !address) {
          address = nextLine.replace('وعنوانها :', '').replace('وعنوانها:', '').replace('-', '').trim();
        }
        
        // Check for sub-number (typically 3 digits)
        if (/^[\u0660-\u0669]{2,3}$/.test(nextLine) || /^\d{2,3}$/.test(nextLine)) {
          // Convert Arabic-Indic digits to Western Arabic digits
          subNumber = nextLine.replace(/[\u0660-\u0669]/g, (d) => 
            String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48)
          ).padStart(3, '0');
          break;
        }
      }
      
      currentCommittee = {
        name: committeeName || 'لجنة انتخابية',
        subNumber: subNumber,
        address: address || undefined,
        voters: []
      };
      currentVoters = [];
    }
    // Detect voter rows - names with numbers in Arabic format
    else if (currentCommittee && /[\u0600-\u06FF]{3,}.*[\u0660-\u0669]/.test(line)) {
      const voters = extractVotersFromLine(line);
      currentVoters.push(...voters);
    }
  }
  
  // Add last committee
  if (currentCommittee && currentVoters.length > 0) {
    currentCommittee.voters = currentVoters;
    committees.push(currentCommittee);
  }
  
  // Calculate totals
  const totalVoters = committees.reduce((sum, committee) => sum + committee.voters.length, 0);
  
  // Validate extracted data with helpful error messages
  if (committees.length === 0) {
    // Provide diagnostic information
    const totalLines = lines.length;
    const sampleLines = lines.slice(0, Math.min(20, lines.length));
    console.error("No committees found. Sample lines:", sampleLines);
    
    throw new Error(
      `لم يتم العثور على أي لجان في الملف. ` +
      `الملف يحتوي على ${totalLines} سطر. ` +
      `تأكد من أن الملف يحتوي على رؤوس لجان مثل "لجنة مدرسة..." أو "اللجنة الانتخابية".`
    );
  }
  
  if (totalVoters === 0) {
    const committeeNames = committees.map(c => c.name).join(', ');
    console.error("No voters found. Committees detected:", committeeNames);
    
    throw new Error(
      `تم العثور على ${committees.length} لجنة ولكن لم يتم العثور على أي ناخبين. ` +
      `تأكد من أن الملف يحتوي على جداول الناخبين بتنسيق "رقم اسم_الناخب".`
    );
  }
  
  return {
    committees,
    totalVoters,
    totalCommittees: committees.length
  };
}

/**
 * Extract voters from a line containing multiple names with Arabic-Indic numbers
 * Format: "name1 ١ name2 ٢ name3 ٣"
 */
function extractVotersFromLine(line: string): Voter[] {
  const voters: Voter[] = [];
  
  // Split by Arabic-Indic digits (٠-٩) or Western digits
  // Pattern matches: Arabic name followed by a number
  const pattern = /([\u0600-\u06FF\s]+?)\s*([\u0660-\u0669]+|\d+)/g;
  let match;
  
  while ((match = pattern.exec(line)) !== null) {
    const fullName = match[1].trim().replace(/\s+/g, ' ');
    let serialNumber = match[2];
    
    // Convert Arabic-Indic digits to Western Arabic digits
    serialNumber = serialNumber.replace(/[\u0660-\u0669]/g, (d) => 
      String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48)
    );
    
    // Validate name has at least 2 words
    const nameWords = fullName.split(/\s+/).filter(word => word.length > 1);
    if (nameWords.length >= 2 && fullName.length > 5) {
      voters.push({
        serialNumber,
        fullName
      });
    }
  }
  
  return voters;
}
