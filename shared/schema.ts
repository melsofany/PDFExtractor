import { z } from "zod";

// Schema for voter data extracted from PDF
export const voterSchema = z.object({
  serialNumber: z.string(),
  fullName: z.string(),
});

export type Voter = z.infer<typeof voterSchema>;

// Schema for committee data
export const committeeSchema = z.object({
  name: z.string(),
  subNumber: z.string(),
  location: z.string().optional(), // المقر
  address: z.string().optional(), // العنوان
  voters: z.array(voterSchema),
});

export type Committee = z.infer<typeof committeeSchema>;

// Schema for extracted PDF data
export const extractedDataSchema = z.object({
  committees: z.array(committeeSchema),
  totalVoters: z.number(),
  totalCommittees: z.number(),
});

export type ExtractedData = z.infer<typeof extractedDataSchema>;

// Schema for flattened Excel row (committee info repeated for each voter)
export const excelRowSchema = z.object({
  committeeName: z.string(),
  committeeSubNumber: z.string(),
  voterSerialNumber: z.string(),
  voterFullName: z.string(),
});

export type ExcelRow = z.infer<typeof excelRowSchema>;
