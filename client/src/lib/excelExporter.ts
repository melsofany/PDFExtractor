import ExcelJS from "exceljs";
import type { ExtractedData, ExcelRow } from "@shared/schema";

/**
 * Export extracted electoral data to Excel file
 * Creates a formatted Excel file with committee and voter information
 */
export async function exportToExcel(data: ExtractedData, filename: string = "بيانات_اللجان_الانتخابية.xlsx"): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("بيانات الناخبين");

  // Set RTL for Arabic
  worksheet.views = [{ rightToLeft: true }];

  // Add headers
  const headers = ["اسم اللجنة", "الرقم الفرعي", "رقم الناخب", "الاسم الكامل"];
  const headerRow = worksheet.addRow(headers);

  // Style headers
  headerRow.font = { bold: true, size: 12, name: "Arial" };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2E7D32" }, // Green background
  };
  headerRow.alignment = { vertical: "middle", horizontal: "right" };
  headerRow.height = 25;

  // Set column widths
  worksheet.columns = [
    { width: 35 }, // Committee name
    { width: 15 }, // Sub number
    { width: 15 }, // Voter serial
    { width: 40 }, // Full name
  ];

  // Flatten data and add rows
  data.committees.forEach((committee) => {
    committee.voters.forEach((voter) => {
      const row = worksheet.addRow([
        committee.name,
        committee.subNumber,
        voter.serialNumber,
        voter.fullName,
      ]);

      // Style data rows
      row.font = { size: 11, name: "Arial" };
      row.alignment = { vertical: "middle", horizontal: "right" };
      row.height = 20;
    });
  });

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Freeze header row
  worksheet.views = [
    {
      rightToLeft: true,
      state: "frozen",
      xSplit: 0,
      ySplit: 1,
    },
  ];

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Download file
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string = "بيانات_اللجان_الانتخابية"): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "-");
  return `${prefix}_${date}_${time}.xlsx`;
}
