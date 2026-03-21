import { useState, useEffect } from "react";
import { FileText, CheckCircle, HelpCircle, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import api from "../services/api";

interface Checklist {
  id: number;
  title: string;
  industry: string | null;
  company_name: string | null;
  is_active: boolean;
  question_count: number;
  created_at: string | null;
}

interface Stats {
  total_checklists: number;
  active_checklists: number;
  total_questions_used: number;
}

interface QuestionStats {
  total_questions: number;
  active_industries: number;
  avg_usage_rate: number;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ChecklistReports() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [checklistStats, setChecklistStats] = useState<Stats>({
    total_checklists: 0,
    active_checklists: 0,
    total_questions_used: 0,
  });
  const [questionStats, setQuestionStats] = useState<QuestionStats>({
    total_questions: 0,
    active_industries: 0,
    avg_usage_rate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [checklistsRes, checklistStatsRes, questionStatsRes] = await Promise.all([
        api.get("/assessments/checklists?limit=100"),
        api.get("/assessments/checklists/stats"),
        api.get("/assessments/questions/stats"),
      ]);

      setChecklists(checklistsRes.data.items);
      setChecklistStats(checklistStatsRes.data);
      setQuestionStats(questionStatsRes.data);
    } catch (error) {
      console.error("Failed to fetch report data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group checklists by industry for charts
  const industryData = checklists.reduce((acc: { name: string; count: number }[], c) => {
    const industry = c.industry || "Uncategorized";
    const existing = acc.find((item) => item.name === industry);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ name: industry, count: 1 });
    }
    return acc;
  }, []);

  // Status data for pie chart
  const statusData = [
    { name: "Active", value: checklistStats.active_checklists },
    { name: "Inactive", value: checklistStats.total_checklists - checklistStats.active_checklists },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Checklist Reports</h1>
        <p className="text-sm text-muted-foreground">
          Overview and analytics for your checklists and questions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Checklists</p>
                <h3 className="text-2xl font-bold">{checklistStats.total_checklists}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Checklists</p>
                <h3 className="text-2xl font-bold">{checklistStats.active_checklists}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                <h3 className="text-2xl font-bold">{questionStats.total_questions}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Question Usage</p>
                <h3 className="text-2xl font-bold">{questionStats.avg_usage_rate}%</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Checklists by Industry</CardTitle>
          </CardHeader>
          <CardContent>
            {industryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={industryData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Checklist Status</CardTitle>
          </CardHeader>
          <CardContent>
            {checklistStats.total_checklists > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Checklists Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Checklists Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Checklist Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checklists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No checklists found
                    </TableCell>
                  </TableRow>
                ) : (
                  checklists.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>
                        {c.industry ? (
                          <Badge variant="secondary" className="text-xs">
                            {c.industry}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.company_name || "-"}
                      </TableCell>
                      <TableCell>{c.question_count}</TableCell>
                      <TableCell>
                        <Badge variant={c.is_active ? "default" : "secondary"} className="text-xs">
                          {c.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
