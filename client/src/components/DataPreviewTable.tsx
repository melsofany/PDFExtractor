import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { ExtractedData, ExcelRow } from "@shared/schema";

interface DataPreviewTableProps {
  data: ExtractedData;
}

export function DataPreviewTable({ data }: DataPreviewTableProps) {
  // Flatten data: repeat committee info for each voter
  const flattenedRows = useMemo<ExcelRow[]>(() => {
    const rows: ExcelRow[] = [];
    data.committees.forEach((committee) => {
      committee.voters.forEach((voter) => {
        rows.push({
          committeeName: committee.name,
          committeeSubNumber: committee.subNumber,
          voterSerialNumber: voter.serialNumber,
          voterFullName: voter.fullName,
        });
      });
    });
    return rows;
  }, [data]);

  if (flattenedRows.length === 0) {
    return null;
  }

  return (
    <Card className="p-6" data-testid="preview-table-card">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">معاينة البيانات</h2>
          <p className="text-sm text-muted-foreground">
            تم استخراج {data.totalVoters} ناخب من {data.totalCommittees} لجنة
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" data-testid="badge-total-voters">
            إجمالي الناخبين: {data.totalVoters}
          </Badge>
          <Badge variant="secondary" data-testid="badge-total-committees">
            عدد اللجان: {data.totalCommittees}
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-96 w-full rounded-md border">
        <table className="w-full" data-testid="table-preview">
          <thead className="bg-muted sticky top-0 z-10">
            <tr className="border-b">
              <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                اسم اللجنة
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                الرقم الفرعي
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                رقم الناخب
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                الاسم الكامل
              </th>
            </tr>
          </thead>
          <tbody>
            {flattenedRows.map((row, index) => (
              <tr
                key={index}
                className="border-b hover:bg-accent/50 transition-colors"
                data-testid={`row-voter-${index}`}
              >
                <td className="px-4 py-3 text-sm text-foreground">
                  {row.committeeName}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {row.committeeSubNumber}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {row.voterSerialNumber}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {row.voterFullName}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>

      <p className="text-sm text-muted-foreground mt-4" data-testid="text-row-count">
        عرض {flattenedRows.length} من {flattenedRows.length} صف
      </p>
    </Card>
  );
}
