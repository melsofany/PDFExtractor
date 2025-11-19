import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { createRequire } from "module";
import type { ExtractedData, Committee, Voter } from "@shared/schema";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse").default || require("pdf-parse");

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

      // Parse PDF
      const pdfData = await pdfParse(req.file.buffer);
      const text = pdfData.text;
      const numPages = pdfData.numpages;

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
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect committee header
    // Pattern: اسم اللجنة followed by number
    // Common patterns: "لجنة", "اللجنة الانتخابية", etc.
    if (isCommitteeHeader(line)) {
      // Save previous committee if exists
      if (currentCommittee && currentVoters.length > 0) {
        currentCommittee.voters = currentVoters;
        committees.push(currentCommittee);
      }
      
      // Extract committee info
      const committeeInfo = extractCommitteeInfo(line, lines[i + 1] || '');
      currentCommittee = {
        name: committeeInfo.name,
        subNumber: committeeInfo.subNumber,
        voters: []
      };
      currentVoters = [];
    }
    // Detect voter row
    // Pattern: number followed by Arabic name
    else if (currentCommittee && isVoterRow(line)) {
      const voter = extractVoterInfo(line);
      if (voter) {
        currentVoters.push(voter);
      }
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
 * Check if a line is a committee header
 * Flexible pattern matching for various committee header formats
 */
function isCommitteeHeader(line: string): boolean {
  // Check for committee keywords (flexible - doesn't require specific word order)
  const hasCommitteeWord = /(?:لجنة|اللجنة)/i.test(line);
  const hasLocationWord = /(?:مدرسة|المدرسة|مركز|المركز|قرية|القرية)/i.test(line);
  
  // Or has specific committee patterns
  const hasCommitteePattern = /(?:لجنة|اللجنة)\s+(?:رقم|انتخابية|فرعية)/i.test(line);
  
  // NOT a voter row (starts with number + name)
  const isNotVoterRow = !/^\d{1,4}\s+[\u0600-\u06FF]{2,}/.test(line);
  
  // Has minimum length and Arabic content
  const hasMinimumLength = line.length > 10;
  const hasArabicContent = /[\u0600-\u06FF]{3,}/.test(line);
  
  return (
    ((hasCommitteeWord && hasLocationWord) || hasCommitteePattern) &&
    isNotVoterRow &&
    hasMinimumLength &&
    hasArabicContent
  );
}

/**
 * Extract committee information from header line(s)
 */
function extractCommitteeInfo(line: string, nextLine: string): { name: string; subNumber: string } {
  // Extract committee name - clean up formatting
  let name = line.trim();
  
  // Remove leading page numbers or list numbers
  name = name.replace(/^(?:صفحة|ص)?\s*\d+\s*[-:]?\s*/, '');
  name = name.replace(/^\d+\s*[-:]?\s*/, '');
  
  // Look for sub-number patterns
  // Common patterns: "رقم فرعي: 001", "فرعي 001", "الرقم الفرعي: 001"
  const subNumberPattern = /(?:رقم\s*فرعي|فرعي|الرقم\s*الفرعي)[:\s]*(\d+)/i;
  const combinedText = line + ' ' + nextLine;
  const subNumberMatch = combinedText.match(subNumberPattern);
  
  let subNumber = "000"; // default if not found
  if (subNumberMatch) {
    subNumber = subNumberMatch[1].padStart(3, '0');
    // Remove sub-number from name if it's there
    name = name.replace(subNumberPattern, '').trim();
  }
  
  // Clean up extra whitespace
  name = name.replace(/\s+/g, ' ').trim();
  
  return { name, subNumber };
}

/**
 * Check if a line is a voter row in the table
 */
function isVoterRow(line: string): boolean {
  // Voter rows must:
  // 1. Start with a number (1-4 digits)
  // 2. Followed by whitespace
  // 3. Then Arabic text (name)
  // 4. Have minimum length to filter out noise
  const pattern = /^\d{1,4}\s+[\u0600-\u06FF\s]{3,}/;
  const hasMinLength = line.length > 5;
  const matchesPattern = pattern.test(line);
  
  // Exclude lines that look like headers or page numbers
  const isNotHeader = !line.includes('لجنة') && !line.includes('صفحة');
  
  return matchesPattern && hasMinLength && isNotHeader;
}

/**
 * Extract voter information from a row
 */
function extractVoterInfo(line: string): Voter | null {
  // Pattern: serial number (1-4 digits) followed by full name
  const match = line.match(/^(\d{1,4})\s+([\u0600-\u06FF\s]+?)(?:\s*$)/);
  
  if (match) {
    const serialNumber = match[1];
    const fullName = match[2].trim().replace(/\s+/g, ' '); // normalize whitespace
    
    // Validate that name has at least 2 Arabic words
    const nameWords = fullName.split(/\s+/).filter(word => word.length > 0);
    if (nameWords.length >= 2) {
      return {
        serialNumber,
        fullName
      };
    }
  }
  
  return null;
}
