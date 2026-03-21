import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  LayoutGrid,
  Table2,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import ChecklistCard from "@/components/checklist/ChecklistCard";

interface Checklist {
  id: number;
  title: string;
  industry: string | null;
  description: string | null;
  company_id: number | null;
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

const PAGE_SIZE = 12;

export default function ChecklistRepository() {
  const navigate = useNavigate();

  // Data state
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [stats, setStats] = useState<Stats>({ total_checklists: 0, active_checklists: 0, total_questions_used: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // View state
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("");

  // Delete state
  const [deleteChecklist, setDeleteChecklist] = useState<Checklist | null>(null);

  useEffect(() => {
    fetchChecklists();
  }, [currentPage, searchTerm, filterActive]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchChecklists = async () => {
    try {
      const params = new URLSearchParams();
      params.append("offset", ((currentPage - 1) * PAGE_SIZE).toString());
      params.append("limit", PAGE_SIZE.toString());
      if (searchTerm) params.append("search", searchTerm);
      if (filterActive === "active") params.append("is_active", "true");
      if (filterActive === "inactive") params.append("is_active", "false");

      const res = await api.get(`/assessments/checklists?${params.toString()}`);
      setChecklists(res.data.items);
      setTotal(res.data.total);
    } catch (error) {
      console.error("Failed to fetch checklists:", error);
      toast.error("Failed to load checklists");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/assessments/checklists/stats");
      setStats(res.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await api.patch(`/assessments/checklists/${id}/toggle`);
      fetchChecklists();
      fetchStats();
      toast.success("Status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteChecklist = async () => {
    if (!deleteChecklist) return;

    try {
      await api.delete(`/assessments/checklists/${deleteChecklist.id}`);
      toast.success("Checklist deleted successfully");
      setDeleteChecklist(null);
      fetchChecklists();
      fetchStats();
    } catch (error) {
      toast.error("Failed to delete checklist");
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Checklist Repository</h1>
          <p className="text-sm text-muted-foreground">
            Manage and organize your operational checklists.
          </p>
        </div>
        <Button onClick={() => navigate("/composer")}>
          <Plus className="h-4 w-4 mr-2" />
          New Checklist
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Checklists</p>
                <h3 className="text-2xl font-bold">{stats.total_checklists}</h3>
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
                <h3 className="text-2xl font-bold">{stats.active_checklists}</h3>
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
                <p className="text-sm font-medium text-muted-foreground">Questions Used</p>
                <h3 className="text-2xl font-bold">{stats.total_questions_used}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search checklists..."
            className="pl-9 bg-white"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <Select value={filterActive || "all"} onValueChange={(v) => { setFilterActive(v === "all" ? "" : v); setCurrentPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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

      {/* Content */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checklists.map((checklist) => (
            <ChecklistCard
              key={checklist.id}
              checklist={checklist}
              onToggleActive={handleToggleActive}
              onDelete={setDeleteChecklist}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Checklist Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checklists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No checklists found
                  </TableCell>
                </TableRow>
              ) : (
                checklists.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      {c.industry && (
                        <Badge variant="secondary" className="text-xs">
                          {c.industry}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.company_name || "-"}
                    </TableCell>
                    <TableCell>{c.question_count}</TableCell>
                    <TableCell>
                      <Switch
                        checked={c.is_active}
                        onCheckedChange={() => handleToggleActive(c.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/composer?edit=${c.id}`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteChecklist(c)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteChecklist} onOpenChange={(open) => !open && setDeleteChecklist(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Checklist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteChecklist?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChecklist}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
