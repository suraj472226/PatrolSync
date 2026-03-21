import { FileText, Building2, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface QuestionStatsProps {
  totalQuestions: number;
  activeIndustries: number;
  avgUsageRate: number;
}

export default function QuestionStatsCards({ totalQuestions, activeIndustries, avgUsageRate }: QuestionStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
              <h3 className="text-2xl font-bold">{totalQuestions.toLocaleString()}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Industries</p>
              <h3 className="text-2xl font-bold">{activeIndustries}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg. Usage Rate</p>
              <h3 className="text-2xl font-bold">{avgUsageRate}%</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
