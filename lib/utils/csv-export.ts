/**
 * CSV Export Utility
 * Handles exporting data to CSV format with proper escaping
 */

export interface CSVExportOptions {
  filename?: string;
  headers?: string[];
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[], headers?: string[]): string {
  if (data.length === 0) return "";

  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0]);

  // Escape CSV values (handle commas, quotes, newlines)
  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) return "";

    const stringValue = String(value);

    // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  // Build CSV content
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(csvHeaders.map(escapeCSVValue).join(","));

  // Add data rows
  for (const row of data) {
    const values = csvHeaders.map((header) => {
      const value = row[header];
      return escapeCSVValue(value);
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

/**
 * Download CSV file
 */
function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Excel UTF-8 support
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV file
 */
export function exportToCSV(data: any[], options: CSVExportOptions = {}): void {
  const { filename = "export.csv", headers } = options;

  const csvContent = convertToCSV(data, headers);
  downloadCSV(csvContent, filename);
}

/**
 * Export payments to CSV
 */
export function exportPaymentsToCSV(payments: any[]): void {
  const csvData = payments.map((p) => ({
    "Receipt No": p.receipt_number || "",
    "Member ID": p.participant_id || "",
    "Amount (₹)": p.amount || "",
    Method: p.payment_method || "",
    Status: p.status || "",
    Date: p.payment_date ? p.payment_date.slice(0, 10) : "",
    Notes: p.notes || "",
  }));

  const timestamp = new Date().toISOString().split("T")[0];
  exportToCSV(csvData, {
    filename: `payments-export-${timestamp}.csv`,
  });
}

/**
 * Export members to CSV
 */
export function exportMembersToCSV(members: any[]): void {
  // Transform member data for CSV
  const csvData = members.map((member) => ({
    "First Name": member.first_name || "",
    "Last Name": member.last_name || "",
    Email: member.email || "",
    Phone: member.phone || "",
    Status: member.membership_status || "",
    "Start Date": member.membership_start_date || "",
    "End Date": member.membership_end_date || "N/A",
  }));

  const timestamp = new Date().toISOString().split("T")[0];
  exportToCSV(csvData, {
    filename: `members-export-${timestamp}.csv`,
  });
}
