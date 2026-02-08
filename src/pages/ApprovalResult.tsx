import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/shared/SEO";

const ApprovalResult = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || "error";
  const message = searchParams.get("message") || "";

  const getStatusContent = () => {
    switch (status) {
      case "success":
        return {
          icon: <CheckCircle className="w-20 h-20 text-green-500" />,
          title: "Access Approved!",
          description: message 
            ? `${message} now has full access to AYN.` 
            : "User access has been successfully approved.",
          color: "text-green-500",
          bgColor: "bg-green-500/10"
        };
      case "expired":
        return {
          icon: <Clock className="w-20 h-20 text-amber-500" />,
          title: "Link Expired",
          description: message || "This approval link has expired. Please use the Admin Panel to approve access manually.",
          color: "text-amber-500",
          bgColor: "bg-amber-500/10"
        };
      case "invalid":
        return {
          icon: <AlertTriangle className="w-20 h-20 text-orange-500" />,
          title: "Invalid Link",
          description: message || "This approval link is invalid or has already been used.",
          color: "text-orange-500",
          bgColor: "bg-orange-500/10"
        };
      default:
        return {
          icon: <XCircle className="w-20 h-20 text-red-500" />,
          title: "Approval Failed",
          description: message || "An error occurred while processing the approval. Please try again from the Admin Panel.",
          color: "text-red-500",
          bgColor: "bg-red-500/10"
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEO title="Approval Result - AYN" description="Access approval status for AYN." noIndex={true} />
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-foreground">AYN</h1>
          <div className="w-12 h-1 bg-foreground mx-auto" />
        </div>

        {/* Status Card */}
        <div className={`rounded-2xl p-8 ${content.bgColor} space-y-6`}>
          <div className="flex justify-center">
            {content.icon}
          </div>
          <div className="space-y-3">
            <h2 className={`text-2xl font-bold ${content.color}`}>
              {content.title}
            </h2>
            <p className="text-muted-foreground">
              {content.description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link to="/admin">
              Open Admin Panel
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">
              Go to Homepage
            </Link>
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} AYN. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ApprovalResult;
