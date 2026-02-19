"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const DAYS = Array.from({ length: 31 }, (_, i) => {
  const d = String(i + 1).padStart(2, "0");
  return { value: d, label: String(i + 1) };
});

const currentYear = new Date().getFullYear();
// Allow birth years from 100 years ago up to 5 years ago (gym members are at least ~5)
const YEARS = Array.from({ length: 96 }, (_, i) => {
  const y = String(currentYear - 5 - i);
  return { value: y, label: y };
});

interface DateOfBirthPickerProps {
  value: string; // YYYY-MM-DD or ""
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DateOfBirthPicker({ value, onChange, disabled }: DateOfBirthPickerProps) {
  const parts = value ? value.split("-") : ["", "", ""];
  const year = parts[0] ?? "";
  const month = parts[1] ?? "";
  const day = parts[2] ?? "";

  const update = (field: "year" | "month" | "day", val: string) => {
    const next = { year, month, day, [field]: val };
    if (next.year && next.month && next.day) {
      onChange(`${next.year}-${next.month}-${next.day}`);
    } else {
      // Partial — clear the full value so the form field stays empty/invalid
      onChange("");
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Day */}
      <Select value={day || undefined} onValueChange={(v) => update("day", v)} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {DAYS.map((d) => (
            <SelectItem key={d.value} value={d.value}>
              {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month */}
      <Select value={month || undefined} onValueChange={(v) => update("month", v)} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Year */}
      <Select value={year || undefined} onValueChange={(v) => update("year", v)} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {YEARS.map((y) => (
            <SelectItem key={y.value} value={y.value}>
              {y.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
