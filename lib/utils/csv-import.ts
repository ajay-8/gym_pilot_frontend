/**
 * CSV Import Utility
 * Handles parsing CSV files for bulk member import
 */

export interface CSVMemberRow {
  first_name: string;
  last_name?: string;
  email?: string;
  phone: string;
  plan_id?: string;
  plan_name?: string;
  membership_start_date?: string;
  date_of_birth?: string;
  gender?: string;
}

export interface ParsedCSVResult {
  data: CSVMemberRow[];
  errors: string[];
  warnings: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ row: number; field: string; message: string }>;
  warnings: Array<{ row: number; field: string; message: string }>;
}

/**
 * Parse CSV text content into structured data
 */
export function parseCSV(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  const rows: string[][] = [];

  for (const line of lines) {
    const values: string[] = [];
    let currentValue = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          currentValue += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        // End of value
        values.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }

    // Add last value
    values.push(currentValue.trim());
    rows.push(values);
  }

  return rows;
}

/**
 * Convert parsed CSV rows into member objects
 */
export function csvToMembers(rows: string[][]): ParsedCSVResult {
  if (rows.length === 0) {
    return { data: [], errors: ["CSV file is empty"], warnings: [] };
  }

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const data: CSVMemberRow[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required headers
  const requiredHeaders = ["first_name", "phone", "membership_start_date", "plan_name"];
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

  if (missingHeaders.length > 0) {
    errors.push(`Missing required columns: ${missingHeaders.join(", ")}`);
    return { data: [], errors, warnings };
  }

  // Parse data rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every((cell) => !cell.trim())) continue; // Skip empty rows

    const member: any = {};

    headers.forEach((header, index) => {
      const value = row[index]?.trim();
      if (value) {
        member[header] = value;
      }
    });

    data.push(member as CSVMemberRow);
  }

  return { data, errors, warnings };
}

/**
 * Helper function to parse dates flexibly
 * Handles formats like: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, and Excel date formats
 */
function parseFlexibleDate(dateString: string): Date | null {
  if (!dateString || !dateString.trim()) {
    return null;
  }

  const trimmed = dateString.trim();

  // Try standard ISO format first (YYYY-MM-DD)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try DD/MM/YYYY or DD-MM-YYYY format
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try MM/DD/YYYY or MM-DD-YYYY format
  const mmddyyyyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (mmddyyyyMatch) {
    const [, month, day, year] = mmddyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try built-in Date parser as fallback
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}

/**
 * Convert date string to YYYY-MM-DD format
 */
export function normalizeDateToISO(dateString: string | undefined): string | undefined {
  if (!dateString) {
    return undefined;
  }

  const date = parseFlexibleDate(dateString);
  if (!date) {
    return dateString; // Return original if can't parse
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Validate member data before import
 */
export function validateMembers(
  members: CSVMemberRow[],
  existingPhones: Set<string> = new Set()
): ValidationResult {
  const errors: Array<{ row: number; field: string; message: string }> = [];
  const warnings: Array<{ row: number; field: string; message: string }> = [];

  const phonePattern = /^(\+91[-\s]?)?[6-9]\d{9}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const seenPhones = new Set<string>();

  members.forEach((member, index) => {
    const rowNum = index + 2; // +2 because index 0 is row 1 (data), and headers are row 0

    // Validate first_name (REQUIRED)
    if (!member.first_name || member.first_name.length === 0) {
      errors.push({ row: rowNum, field: "first_name", message: "First name is required" });
    }

    // Validate phone (REQUIRED)
    if (!member.phone) {
      errors.push({ row: rowNum, field: "phone", message: "Phone is required" });
    } else if (!phonePattern.test(member.phone)) {
      errors.push({
        row: rowNum,
        field: "phone",
        message: "Invalid phone format (must be Indian mobile: 10 digits starting with 6-9)",
      });
    } else {
      // Check for duplicates in file
      if (seenPhones.has(member.phone)) {
        errors.push({
          row: rowNum,
          field: "phone",
          message: "Duplicate phone number in CSV",
        });
      }
      seenPhones.add(member.phone);

      // Check against existing members
      if (existingPhones.has(member.phone)) {
        warnings.push({
          row: rowNum,
          field: "phone",
          message: "Phone number already exists in system",
        });
      }
    }

    // Validate plan_name (REQUIRED)
    if (!member.plan_name || member.plan_name.length === 0) {
      errors.push({ row: rowNum, field: "plan_name", message: "Plan name is required" });
    }

    // Validate membership_start_date (REQUIRED)
    if (!member.membership_start_date) {
      errors.push({
        row: rowNum,
        field: "membership_start_date",
        message: "Membership start date is required",
      });
    } else {
      const startDate = parseFlexibleDate(member.membership_start_date);
      if (!startDate) {
        errors.push({
          row: rowNum,
          field: "membership_start_date",
          message: "Invalid date format (use YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY)",
        });
      }
    }

    // Validate email (optional but must be valid if provided)
    if (member.email && !emailPattern.test(member.email)) {
      errors.push({ row: rowNum, field: "email", message: "Invalid email format" });
    }

    // Validate date_of_birth (optional but must be valid if provided)
    if (member.date_of_birth) {
      const dob = parseFlexibleDate(member.date_of_birth);
      if (!dob) {
        errors.push({
          row: rowNum,
          field: "date_of_birth",
          message: "Invalid date format (use YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY)",
        });
      } else if (dob > new Date()) {
        errors.push({
          row: rowNum,
          field: "date_of_birth",
          message: "Date of birth cannot be in the future",
        });
      }
    }

    // Validate gender (optional but must be valid value if provided)
    if (member.gender) {
      const validGenders = ["male", "female", "other", "prefer_not_to_say"];
      if (!validGenders.includes(member.gender.toLowerCase())) {
        errors.push({
          row: rowNum,
          field: "gender",
          message: `Invalid gender (must be one of: ${validGenders.join(", ")})`,
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Read CSV file from File object
 */
export function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Generate sample CSV template
 */
export function generateCSVTemplate(): string {
  const headers = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "plan_name",
    "membership_start_date",
    "date_of_birth",
    "gender",
  ];

  // Use example dates to show that historical data can be imported
  // You can use any past or present dates for membership_start_date
  const sampleRows = [
    [
      "John",
      "Doe",
      "john.doe@example.com",
      "9876543210",
      "Basic Monthly",
      "2025-06-15", // Example: member who joined 8 months ago
      "1990-05-20",
      "male",
    ],
    [
      "Jane",
      "Smith",
      "jane.smith@example.com",
      "9876543211",
      "Premium Monthly",
      "2024-11-20", // Example: member who joined over a year ago
      "1992-08-15",
      "female",
    ],
  ];

  const csvContent = [headers.join(","), ...sampleRows.map((row) => row.join(","))].join("\n");

  return csvContent;
}

/**
 * Download CSV template file
 */
export function downloadCSVTemplate(): void {
  const csvContent = generateCSVTemplate();
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", "member-import-template.csv");
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
