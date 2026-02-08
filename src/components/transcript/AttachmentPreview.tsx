import { cn } from "@/lib/utils";
import { FileText, FileSpreadsheet, File, Download } from "lucide-react";
import { openDocumentUrl } from "@/lib/documentUrlUtils";
import { useState } from "react";

interface AttachmentPreviewProps {
  url: string;
  name: string;
  type: string;
}

export const AttachmentPreview = ({ url, name, type }: AttachmentPreviewProps) => {
  const [imgError, setImgError] = useState(false);

  const isImage = type?.startsWith("image/") || /\.(jpe?g|png|gif|webp|svg)$/i.test(name);
  const isPdf = type === "application/pdf" || type === "pdf" || name?.endsWith(".pdf");
  const isExcel =
    type?.includes("spreadsheet") ||
    type?.includes("csv") ||
    /\.(xlsx?|csv)$/i.test(name);

  const handleDownload = () => openDocumentUrl(url, name);

  // Image thumbnail
  if (isImage && !imgError) {
    return (
      <div className="mt-2 group/img relative inline-block rounded-xl overflow-hidden max-w-[240px]">
        <img
          src={url}
          alt={name || "Attached image"}
          className="max-h-[160px] w-auto rounded-xl object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-background/80 text-foreground hover:bg-background transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // File card (PDF, Excel, generic)
  const Icon = isPdf ? FileText : isExcel ? FileSpreadsheet : File;
  const accent = isPdf
    ? "bg-red-500/10 text-red-600 dark:text-red-400"
    : isExcel
    ? "bg-green-500/10 text-green-600 dark:text-green-400"
    : "bg-primary/10 text-primary";
  const label = isPdf ? "PDF" : isExcel ? "Spreadsheet" : "File";

  return (
    <button
      onClick={handleDownload}
      className={cn(
        "mt-2 flex items-center gap-3 w-full max-w-[280px] p-2.5 rounded-xl",
        "bg-muted/40 hover:bg-muted border border-border/50",
        "transition-all duration-200 group/file text-left"
      )}
    >
      <div className={cn("flex-shrink-0 p-2 rounded-lg", accent)}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">
          {name || `${label} file`}
        </p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
      <Download className="w-3.5 h-3.5 text-muted-foreground group-hover/file:text-foreground transition-colors flex-shrink-0" />
    </button>
  );
};
