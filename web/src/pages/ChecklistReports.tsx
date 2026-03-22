import { useState, useEffect } from "react";
import { FileText, CheckCircle, HelpCircle, Building2, Clock, UserCheck, Eye, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Submission {
  id: number;
  checklist_id: number;
  checklist_title: string;
  user_id: number;
  employee_id: string;
  employee_name: string;
  status: string;
  site_name: string | null;
  answered_questions: number;
  total_questions: number;
  completion_percentage: number;
  created_at: string | null;
  submitted_at: string | null;
  latitude: number | null;
  longitude: number | null;
  has_signature: boolean;
}

interface SubmissionDetail {
  id: number;
  checklist_title: string;
  employee_id: string;
  status: string;
  site_name: string | null;
  latitude: number | null;
  longitude: number | null;
  signature_url: string | null;
  created_at: string | null;
  submitted_at: string | null;
  answers: {
    id: number;
    question_text: string;
    is_critical: boolean;
    answer_value: string | null;
    comment: string | null;
    photo_urls: string[];
    is_compliant: boolean;
  }[];
}

interface SubmissionStats {
  total_submissions: number;
  submitted: number;
  drafts: number;
  reviewed: number;
  today_submissions: number;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ChecklistReports() {
  const [activeTab, setActiveTab] = useState("overview");

  // Overview data
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

  // Submissions data
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionStats, setSubmissionStats] = useState<SubmissionStats>({
    total_submissions: 0,
    submitted: 0,
    drafts: 0,
    reviewed: 0,
    today_submissions: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [checklistFilter, setChecklistFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail modal
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeTab === "overview") {
      fetchOverviewData();
    } else {
      fetchSubmissionsData();
    }
  }, [activeTab, statusFilter, checklistFilter]);

  const fetchOverviewData = async () => {
    try {
      setIsLoading(true);
      const [checklistsRes, checklistStatsRes, questionStatsRes] = await Promise.all([
        api.get("/assessments/checklists?limit=100"),
        api.get("/assessments/checklists/stats"),
        api.get("/assessments/questions/stats"),
      ]);

      setChecklists(checklistsRes.data.items);
      setChecklistStats(checklistStatsRes.data);
      setQuestionStats(questionStatsRes.data);
    } catch (error) {
      console.error("Failed to fetch overview data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissionsData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("limit", "100");

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (checklistFilter !== "all") {
        params.append("checklist_id", checklistFilter);
      }

      const [submissionsRes, statsRes, checklistsRes] = await Promise.all([
        api.get(`/assessments/submissions?${params.toString()}`),
        api.get("/assessments/submissions/stats"),
        api.get("/assessments/checklists?limit=100"),
      ]);

      setSubmissions(submissionsRes.data.items);
      setSubmissionStats(statsRes.data);
      setChecklists(checklistsRes.data.items);
    } catch (error) {
      console.error("Failed to fetch submissions data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDetail = async (submissionId: number) => {
    setLoadingDetail(true);
    setIsDetailOpen(true);
    try {
      const response = await api.get(`/assessments/submissions/${submissionId}`);
      setSelectedSubmission(response.data);
    } catch (error) {
      console.error("Failed to fetch submission detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const markAsReviewed = async (submissionId: number) => {
    try {
      await api.patch(`/assessments/submissions/${submissionId}/review`);
      fetchSubmissionsData();
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission({ ...selectedSubmission, status: "reviewed" });
      }
    } catch (error) {
      console.error("Failed to mark as reviewed:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-blue-500">Submitted</Badge>;
      case "reviewed":
        return <Badge className="bg-green-500">Reviewed</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  const filteredSubmissions = submissions.filter((s) =>
    searchQuery
      ? s.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.checklist_title.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

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
          Overview and employee submission tracking
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Employee Submissions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
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
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <h3 className="text-2xl font-bold">{submissionStats.total_submissions}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <h3 className="text-2xl font-bold">{submissionStats.submitted}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reviewed</p>
                    <h3 className="text-2xl font-bold">{submissionStats.reviewed}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                    <h3 className="text-2xl font-bold">{submissionStats.drafts}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Today</p>
                    <h3 className="text-2xl font-bold">{submissionStats.today_submissions}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search by employee ID or checklist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={checklistFilter} onValueChange={setChecklistFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Checklist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Checklists</SelectItem>
                    {checklists.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Submissions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employee Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Checklist</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredSubmissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No submissions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubmissions.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <UserCheck className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{s.employee_id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{s.checklist_title}</TableCell>
                          <TableCell>
                            {s.site_name ? (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {s.site_name}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${s.completion_percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {s.answered_questions}/{s.total_questions}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(s.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(s.submitted_at || s.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDetail(s.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {s.status === "submitted" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => markAsReviewed(s.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Review
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.checklist_title} by {selectedSubmission?.employee_id}
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : selectedSubmission ? (
            <div className="space-y-6">
              {/* Meta Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="text-sm font-medium">{formatDate(selectedSubmission.submitted_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Site</p>
                  <p className="text-sm font-medium">{selectedSubmission.site_name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">
                    {selectedSubmission.latitude && selectedSubmission.longitude
                      ? `${selectedSubmission.latitude.toFixed(4)}, ${selectedSubmission.longitude.toFixed(4)}`
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Answers */}
              <div>
                <h4 className="font-semibold mb-3">Answers ({selectedSubmission.answers.length})</h4>
                <div className="space-y-3">
                  {selectedSubmission.answers.map((answer, index) => (
                    <div
                      key={answer.id}
                      className={`p-4 rounded-lg border ${
                        answer.is_critical ? "border-red-200 bg-red-50" : "bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              Q{index + 1}
                            </span>
                            {answer.is_critical && (
                              <Badge variant="destructive" className="text-xs">
                                Critical
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 font-medium">{answer.question_text}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              answer.answer_value === "Yes"
                                ? "default"
                                : answer.answer_value === "No"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {answer.answer_value || "No answer"}
                          </Badge>
                        </div>
                      </div>
                      {answer.comment && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          <strong>Comment:</strong> {answer.comment}
                        </p>
                      )}
                      {answer.photo_urls && answer.photo_urls.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {answer.photo_urls.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Attachment ${i + 1}`}
                              className="h-16 w-16 object-cover rounded border"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature */}
              {selectedSubmission.signature_url && (
                <div>
                  <h4 className="font-semibold mb-3">Signature</h4>
                  <img
                    src={selectedSubmission.signature_url}
                    alt="Signature"
                    className="h-24 border rounded bg-white p-2"
                  />
                </div>
              )}

              {/* Actions */}
              {selectedSubmission.status === "submitted" && (
                <div className="flex justify-end">
                  <Button onClick={() => markAsReviewed(selectedSubmission.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Reviewed
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
