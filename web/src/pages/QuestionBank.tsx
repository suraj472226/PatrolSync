import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit, CheckCircle2, LayoutGrid, Table2, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import api from "../services/api";
import QuestionStatsCards from "@/components/checklist/QuestionStatsCards";
import QuestionTableView from "@/components/checklist/QuestionTableView";
import QuestionEditModal from "@/components/checklist/QuestionEditModal";
import QuestionDeleteDialog from "@/components/checklist/QuestionDeleteDialog";
import TagInput from "@/components/checklist/TagInput";
import MultipleChoiceOptions from "@/components/checklist/MultipleChoiceOptions";

interface Question {
  id: number;
  text: string;
  response_type: string;
  industry: string | null;
  region: string | null;
  category: string | null;
  company_id: number | null;
  company_name: string | null;
  tags: string[] | null;
  options: string[] | null;
}

interface Company {
  id: number;
  name: string;
}

interface Stats {
  total_questions: number;
  active_industries: number;
  avg_usage_rate: number;
}

const CATEGORIES = ["Safety & Health", "Operational", "Compliance", "Quality Control"];
const RESPONSE_TYPES = ["Yes / No / NA", "Multiple Choice", "Free Text"];
const PAGE_SIZE = 10;

export default function QuestionBank() {
  // Data state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<Stats>({ total_questions: 0, active_industries: 0, avg_usage_rate: 0 });
  const [filterOptions, setFilterOptions] = useState<{ industries: string[]; categories: string[] }>({
    industries: [],
    categories: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // View state
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCompany, setFilterCompany] = useState("");

  // Form state
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState("Yes / No / NA");
  const [newIndustry, setNewIndustry] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newCompanyId, setNewCompanyId] = useState<number | null>(null);
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newOptions, setNewOptions] = useState<string[]>([]);

  // Modal state
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);

  // Fetch data on load and filter changes
  useEffect(() => {
    fetchQuestions();
  }, [currentPage, searchTerm, filterIndustry, filterCategory, filterCompany]);

  useEffect(() => {
    fetchStats();
    fetchCompanies();
    fetchFilterOptions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams();
      params.append("offset", ((currentPage - 1) * PAGE_SIZE).toString());
      params.append("limit", PAGE_SIZE.toString());
      if (searchTerm) params.append("search", searchTerm);
      if (filterIndustry) params.append("industry", filterIndustry);
      if (filterCategory) params.append("category", filterCategory);
      if (filterCompany) params.append("company_id", filterCompany);

      const res = await api.get(`/assessments/questions?${params.toString()}`);
      setQuestions(res.data.items);
      setTotal(res.data.total);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/assessments/questions/stats");
      setStats(res.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await api.get("/assessments/companies");
      setCompanies(res.data);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const res = await api.get("/assessments/filter-options");
      setFilterOptions(res.data);
    } catch (error) {
      console.error("Failed to fetch filter options:", error);
    }
  };

  const handleCreateQuestion = async () => {
    if (!newText.trim()) {
      toast.error("Please enter a question text");
      return;
    }

    try {
      const payload: any = {
        text: newText,
        response_type: newType,
        industry: newIndustry || null,
        region: newRegion || null,
        category: newCategory || null,
        company_id: newCompanyId,
        tags: newTags.length > 0 ? newTags : null,
      };

      if (newType === "Multiple Choice" && newOptions.length > 0) {
        payload.options = newOptions;
      }

      await api.post("/assessments/questions", payload);
      toast.success("Question created successfully");

      // Reset form
      setNewText("");
      setNewType("Yes / No / NA");
      setNewIndustry("");
      setNewRegion("");
      setNewCategory("");
      setNewCompanyId(null);
      setNewTags([]);
      setNewOptions([]);

      // Refresh data
      fetchQuestions();
      fetchStats();
      fetchFilterOptions();
    } catch (error) {
      toast.error("Failed to create question");
    }
  };

  const handleUpdateQuestion = async (data: Partial<Question>) => {
    if (!editQuestion) return;

    try {
      await api.put(`/assessments/questions/${editQuestion.id}`, data);
      toast.success("Question updated successfully");
      fetchQuestions();
      fetchFilterOptions();
    } catch (error) {
      toast.error("Failed to update question");
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteQuestion) return;

    try {
      await api.delete(`/assessments/questions/${deleteQuestion.id}`);
      toast.success("Question deleted successfully");
      setDeleteQuestion(null);
      fetchQuestions();
      fetchStats();
    } catch (error) {
      toast.error("Failed to delete question");
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Question Bank</h1>
          <p className="text-sm text-muted-foreground">
            Manage and organize your global assessment questions.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <QuestionStatsCards
        totalQuestions={stats.total_questions}
        activeIndustries={stats.active_industries}
        avgUsageRate={stats.avg_usage_rate}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Question List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <Select value={filterIndustry || "all"} onValueChange={(v) => { setFilterIndustry(v === "all" ? "" : v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {filterOptions.industries.map((ind) => (
                  <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory || "all"} onValueChange={(v) => { setFilterCategory(v === "all" ? "" : v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-r-none"
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-l-none"
                onClick={() => setViewMode("table")}
              >
                <Table2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              {total} Total
            </div>
          </div>

          {/* Questions Display */}
          {viewMode === "table" ? (
            <QuestionTableView
              questions={questions}
              onEdit={(q) => setEditQuestion(q)}
              onDelete={(q) => setDeleteQuestion(q)}
            />
          ) : (
            <div className="space-y-3">
              {questions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No questions found. Add your first question using the form.</p>
                </div>
              ) : (
                questions.map((q) => (
                <Card key={q.id} className="border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex gap-4 items-start">
                    <div className="mt-1">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
                          {q.industry || "General"}
                        </p>
                        {q.category && (
                          <Badge variant="outline" className="text-xs">
                            {q.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-base font-semibold leading-snug">{q.text}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="secondary" className="text-xs">
                          {q.response_type}
                        </Badge>
                        {q.company_name && (
                          <Badge variant="secondary" className="text-xs">
                            {q.company_name}
                          </Badge>
                        )}
                        {q.tags?.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => setEditQuestion(q)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteQuestion(q)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>

        {/* RIGHT: Add Question Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 border-border shadow-sm">
            <CardHeader className="bg-secondary/30 border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="bg-primary/10 text-primary p-1.5 rounded-md">
                  <Plus className="h-4 w-4" />
                </div>
                Add Question
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Create a new question with response types and metadata tags.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Question Text</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Enter the question text here..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Response Type</label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESPONSE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newType === "Multiple Choice" && (
                <MultipleChoiceOptions options={newOptions} onOptionsChange={setNewOptions} />
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={newCategory || "none"} onValueChange={(v) => setNewCategory(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Industry</label>
                  <Input
                    placeholder="e.g. Manufacturing"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Region</label>
                  <Input
                    placeholder="e.g. Global"
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <Select
                  value={newCompanyId?.toString() || "none"}
                  onValueChange={(v) => setNewCompanyId(v === "none" ? null : parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <TagInput tags={newTags} onTagsChange={setNewTags} />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setNewText("");
                    setNewType("Yes / No / NA");
                    setNewIndustry("");
                    setNewRegion("");
                    setNewCategory("");
                    setNewCompanyId(null);
                    setNewTags([]);
                    setNewOptions([]);
                  }}
                >
                  Discard
                </Button>
                <Button onClick={handleCreateQuestion}>Create Question</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <QuestionEditModal
        open={!!editQuestion}
        onOpenChange={(open) => !open && setEditQuestion(null)}
        question={editQuestion}
        companies={companies}
        onSave={handleUpdateQuestion}
      />

      <QuestionDeleteDialog
        open={!!deleteQuestion}
        onOpenChange={(open) => !open && setDeleteQuestion(null)}
        questionText={deleteQuestion?.text || ""}
        onConfirm={handleDeleteQuestion}
      />
    </div>
  );
}
