import { Card, CardContent } from "@/components/ui/card";
import { 
  Shield, 
  Zap, 
  Calculator, 
  Globe,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StatusCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  status: "good" | "warning" | "error";
  summary: string;
  details?: string[];
}

const defaultCards: StatusCard[] = [
  {
    id: "security",
    title: "Security",
    icon: <Shield className="h-5 w-5" />,
    status: "good",
    summary: "All security tests passing",
    details: [
      "Login and authentication working",
      "Data protection verified",
      "No vulnerabilities detected"
    ]
  },
  {
    id: "performance",
    title: "Performance",
    icon: <Zap className="h-5 w-5" />,
    status: "good",
    summary: "Fast response times",
    details: [
      "Pages load in under 2 seconds",
      "AI responses averaging 2.5s",
      "Handles 100+ concurrent users"
    ]
  },
  {
    id: "engineering",
    title: "Engineering Tools",
    icon: <Calculator className="h-5 w-5" />,
    status: "good",
    summary: "All calculators working",
    details: [
      "Beam, column, foundation calculators verified",
      "3D visualizations rendering correctly",
      "PDF reports generating properly"
    ]
  },
  {
    id: "languages",
    title: "Languages",
    icon: <Globe className="h-5 w-5" />,
    status: "warning",
    summary: "Arabic 85% complete",
    details: [
      "Most pages fully translated",
      "Settings page needs translation",
      "Some admin labels in English"
    ]
  }
];

const SimpleStatusCards = ({ cards = defaultCards }: { cards?: StatusCard[] }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return { bg: "bg-green-500/10", border: "border-green-500/20", icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> };
      case "warning":
        return { bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: <AlertCircle className="h-4 w-4 text-yellow-500" /> };
      case "error":
        return { bg: "bg-red-500/10", border: "border-red-500/20", icon: <AlertCircle className="h-4 w-4 text-red-500" /> };
      default:
        return { bg: "bg-muted", border: "border-border", icon: <CheckCircle2 className="h-4 w-4" /> };
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((card) => {
        const statusStyle = getStatusColor(card.status);
        const isExpanded = expandedId === card.id;

        return (
          <Card 
            key={card.id}
            className={`${statusStyle.bg} ${statusStyle.border} border cursor-pointer transition-all hover:shadow-md`}
            onClick={() => setExpandedId(isExpanded ? null : card.id)}
          >
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-primary">{card.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{card.title}</span>
                      {statusStyle.icon}
                    </div>
                    <p className="text-xs text-muted-foreground">{card.summary}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              
              <AnimatePresence>
                {isExpanded && card.details && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <ul className="mt-3 pt-3 border-t border-border/50 space-y-1">
                      {card.details.map((detail, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SimpleStatusCards;
