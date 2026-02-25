"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useMemberBulkImport } from "@/lib/hooks/use-members";
import { Upload, Download, AlertCircle, CheckCircle2, X, FileText } from "lucide-react";
import {
  readCSVFile,
  parseCSV,
  csvToMembers,
  validateMembers,
  downloadCSVTemplate,
  normalizeDateToISO,
  type CSVMemberRow,
  type ValidationResult,
} from "@/lib/utils/csv-import";
import { BulkMemberImportItem, BulkMemberImportResultItem } from "@/types/api";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CSVImportDialog({ open, onOpenChange }: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [members, setMembers] = useState<CSVMemberRow[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);
  const [failedResults, setFailedResults] = useState<BulkMemberImportResultItem[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "complete">("upload");

  const bulkImport = useMemberBulkImport();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      const csvText = await readCSVFile(selectedFile);
      const rows = parseCSV(csvText);
      const result = csvToMembers(rows);

      if (result.errors.length > 0) {
        alert(result.errors.join("\n"));
        return;
      }

      setFile(selectedFile);
      setMembers(result.data);

      // Validate members
      const validationResult = validateMembers(result.data);
      setValidation(validationResult);

      setStep("preview");
    } catch {
      alert("Failed to read CSV file. Please check the file format.");
    }
  };

  const handleImport = async () => {
    if (!validation?.isValid) return;

    setStep("importing");

    try {
      // Convert CSV members to bulk import format with normalized dates
      const bulkMembers: BulkMemberImportItem[] = members.map((member) => ({
        phone: member.phone,
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        date_of_birth: normalizeDateToISO(member.date_of_birth),
        gender: member.gender as any,
        plan_name: member.plan_name!,
        membership_start_date: normalizeDateToISO(member.membership_start_date)!,
      }));

      // Call bulk import API
      const result = await bulkImport.mutateAsync({ members: bulkMembers });

      setImportResults({ success: result.success, failed: result.failed });

      // Store failed results for display
      const failed = result.results.filter((r) => !r.success);
      setFailedResults(failed);

      setStep("complete");
    } catch (error) {
      console.error("Bulk import failed:", error);
      alert("Failed to import members. Please try again.");
      setStep("preview");
    }
  };

  const handleClose = () => {
    setFile(null);
    setMembers([]);
    setValidation(null);
    setImportResults(null);
    setFailedResults([]);
    setStep("upload");
    onOpenChange(false);
  };

  const handleReset = () => {
    setFile(null);
    setMembers([]);
    setValidation(null);
    setFailedResults([]);
    setStep("upload");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Members from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import members. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === "upload" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Select a CSV file with member data
              </p>
              <Button variant="outline" size="sm" onClick={downloadCSVTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="text-sm font-medium mb-2">Click to upload CSV file</div>
              <div className="text-xs text-muted-foreground mb-4">
                or drag and drop
              </div>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="csv-file-input">
                <Button type="button" variant="secondary" asChild>
                  <span className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </span>
                </Button>
              </label>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="text-sm font-medium mb-2">Required Columns:</div>
                <ul className="text-xs space-y-1">
                  <li>• <strong>first_name</strong> - Member's first name</li>
                  <li>• <strong>phone</strong> - 10-digit mobile starting with 6-9</li>
                  <li>• <strong>plan_name</strong> - Name of membership plan (e.g., "Basic Monthly")</li>
                  <li>• <strong>membership_start_date</strong> - When membership started (any past/present date, YYYY-MM-DD)</li>
                </ul>
                <div className="text-sm font-medium mt-3 mb-2">Optional Columns:</div>
                <ul className="text-xs space-y-1">
                  <li>• last_name, email, date_of_birth, gender</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Preview Step */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">File: {file?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {members.length} member{members.length === 1 ? "" : "s"} ready to import
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <X className="mr-2 h-4 w-4" />
                Choose Different File
              </Button>
            </div>

            {/* Validation Summary */}
            {validation && validation.isValid && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="font-medium text-green-900 mb-2">
                    CSV file validated successfully
                  </div>
                  <div className="text-xs text-green-800 space-y-1">
                    <div>✓ All required headers present (first_name, phone, plan_name, membership_start_date)</div>
                    <div>✓ {members.length} rows found</div>
                    <div>✓ Data format looks good</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Validation Errors */}
            {validation && validation.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">
                    {validation.errors.length} validation error{validation.errors.length === 1 ? "" : "s"} found:
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {validation.errors.slice(0, 10).map((error, i) => (
                      <div key={i} className="text-xs">
                        Row {error.row}: <strong>{error.field}</strong> - {error.message}
                      </div>
                    ))}
                    {validation.errors.length > 10 && (
                      <div className="text-xs font-medium mt-2">
                        ... and {validation.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Validation Warnings */}
            {validation && validation.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">
                    {validation.warnings.length} warning{validation.warnings.length === 1 ? "" : "s"}:
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {validation.warnings.slice(0, 5).map((warning, i) => (
                      <div key={i} className="text-xs">
                        Row {warning.row}: <strong>{warning.field}</strong> - {warning.message}
                      </div>
                    ))}
                    {validation.warnings.length > 5 && (
                      <div className="text-xs font-medium mt-2">
                        ... and {validation.warnings.length - 5} more warnings
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Importing Step */}
        {step === "importing" && (
          <div className="space-y-4">
            <div className="text-center space-y-4 py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="font-medium">Importing {members.length} members...</p>
              <p className="text-sm text-muted-foreground">
                This may take a moment. Please don't close this dialog.
              </p>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === "complete" && importResults && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <p className="font-medium text-lg">Import Complete!</p>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Badge variant="success" className="text-base px-4 py-2">
                {importResults.success} Successful
              </Badge>
              {importResults.failed > 0 && (
                <Badge variant="destructive" className="text-base px-4 py-2">
                  {importResults.failed} Failed
                </Badge>
              )}
            </div>

            {importResults.failed > 0 && failedResults.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">
                    {failedResults.length} member{failedResults.length === 1 ? "" : "s"} could not be imported:
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 text-xs">
                    {failedResults.map((result, i) => (
                      <div key={i} className="border-l-2 border-destructive/50 pl-2">
                        <div className="font-medium">
                          Row {result.row}: {result.first_name} ({result.phone})
                        </div>
                        <div className="text-destructive-foreground/80">
                          {result.error || "Unknown error"}
                        </div>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!validation?.isValid}>
                Import {members.length} Member{members.length === 1 ? "" : "s"}
              </Button>
            </>
          )}
          {step === "complete" && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
