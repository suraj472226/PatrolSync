import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Trash2,
  Eye,
  Camera,
  Video,
  FileText,
  MessageSquare,
  GripVertical,
  CheckSquare,
  Square,
} from "lucide-react";
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
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "../services/api";
import ChecklistPreviewModal from "@/components/checklist/ChecklistPreviewModal";

interface Question {
  id: number;
  text: string;
  response_type: string;
  industry: string | null;
  category: string | null;
}

interface ComposerItem {
  question_id: number;
  text: string;
  response_type: string;
  is_critical: boolean;
  requires_photo: boolean;
  requires_video: boolean;
  requires_doc: boolean;
  requires_comment: boolean;
}

interface Company {
  id: number;
  name: string;
}

// Sortable Item Component
function SortableItem({
  item,
  index,
  onRemove,
  onToggleRule,
}: {
  item: ComposerItem;
  index: number;
  onRemove: (id: number) => void;
  onToggleRule: (id: number, rule: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.question_id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border rounded-lg p-4 shadow-sm relative group"
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1">
          <p className="font-medium text-sm leading-snug">
            {index + 1}. {item.text}
          </p>
          <span className="text-xs text-muted-foreground">{item.response_type}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-red-500 hover:bg-red-50 h-8 w-8"
          onClick={() => onRemove(item.question_id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs">
        <button
          onClick={() => onToggleRule(item.question_id, "is_critical")}
          className={`flex items-center gap-1.5 font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors ${
            item.is_critical
              ? "text-red-600 bg-red-50"
              : "text-green-600 bg-green-50"
          }`}
        >
          <div
            className={`h-2 w-2 rounded-full ${
              item.is_critical ? "bg-red-600" : "bg-green-600"
            }`}
          />
          {item.is_critical ? "Critical" : "Standard"}
        </button>

        <div className="h-4 w-px bg-border" />

        <div className="flex gap-2">
          <MediaToggle
            active={item.requires_photo}
            onClick={() => onToggleRule(item.question_id, "requires_photo")}
            icon={<Camera className="h-3 w-3" />}
            label="Photo"
          />
          <MediaToggle
            active={item.requires_video}
            onClick={() => onToggleRule(item.question_id, "requires_video")}
            icon={<Video className="h-3 w-3" />}
            label="Video"
          />
          <MediaToggle
            active={item.requires_doc}
            onClick={() => onToggleRule(item.question_id, "requires_doc")}
            icon={<FileText className="h-3 w-3" />}
            label="Doc"
          />
          <MediaToggle
            active={item.requires_comment}
            onClick={() => onToggleRule(item.question_id, "requires_comment")}
            icon={<MessageSquare className="h-3 w-3" />}
            label="Comment"
          />
        </div>
      </div>
    </div>
  );
}

function MediaToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs transition-colors ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-muted-foreground border-border hover:bg-secondary"
      }`}
    >
      {icon} {label}
    </button>
  );
}

export default function ChecklistComposer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get("edit");

  // Data state
  const [globalQuestions, setGlobalQuestions] = useState<Question[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Form state
  const [checklistTitle, setChecklistTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [composerItems, setComposerItems] = useState<ComposerItem[]>([]);

  // Modal state
  const [previewOpen, setPreviewOpen] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchQuestions();
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (editId) {
      fetchChecklist(parseInt(editId));
    }
  }, [editId]);

  const fetchQuestions = async () => {
    try {
      const res = await api.get("/assessments/questions?limit=500");
      const items = res.data.items || res.data || [];
      setGlobalQuestions(items);
    } catch (error) {
      console.error("Failed to load question bank:", error);
      toast.error("Failed to load questions");
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

  const fetchChecklist = async (id: number) => {
    try {
      const res = await api.get(`/assessments/checklists/${id}`);
      const checklist = res.data;

      setChecklistTitle(checklist.title);
      setIndustry(checklist.industry || "");
      setCompanyId(checklist.company_id);

      if (checklist.questions) {
        const items: ComposerItem[] = checklist.questions.map((q: any) => ({
          question_id: q.question_id,
          text: q.text,
          response_type: q.response_type,
          is_critical: q.is_critical,
          requires_photo: q.requires_photo,
          requires_video: q.requires_video,
          requires_doc: q.requires_doc,
          requires_comment: q.requires_comment,
        }));
        setComposerItems(items);
        setSelectedIds(new Set(items.map((i) => i.question_id)));
      }
    } catch (error) {
      toast.error("Failed to load checklist");
      navigate("/checklists");
    }
  };

  const toggleQuestionSelection = (question: Question) => {
    const newSelected = new Set(selectedIds);

    if (selectedIds.has(question.id)) {
      // Remove from composer
      newSelected.delete(question.id);
      setComposerItems((items) => items.filter((i) => i.question_id !== question.id));
    } else {
      // Add to composer
      newSelected.add(question.id);
      const newItem: ComposerItem = {
        question_id: question.id,
        text: question.text,
        response_type: question.response_type,
        is_critical: false,
        requires_photo: false,
        requires_video: false,
        requires_doc: false,
        requires_comment: false,
      };
      setComposerItems((items) => [...items, newItem]);
    }

    setSelectedIds(newSelected);
  };

  const handleRemoveItem = (id: number) => {
    setComposerItems((items) => items.filter((i) => i.question_id !== id));
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const toggleRule = (id: number, rule: string) => {
    setComposerItems((items) =>
      items.map((item) => {
        if (item.question_id === id) {
          return { ...item, [rule]: !item[rule as keyof ComposerItem] };
        }
        return item;
      })
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setComposerItems((items) => {
        const oldIndex = items.findIndex((i) => i.question_id === active.id);
        const newIndex = items.findIndex((i) => i.question_id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    if (!checklistTitle.trim()) {
      toast.error("Please enter a checklist title");
      return;
    }
    if (composerItems.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    try {
      const payload = {
        title: checklistTitle,
        industry: industry || null,
        company_id: companyId,
        items: composerItems.map((item) => ({
          question_id: item.question_id,
          is_critical: item.is_critical,
          requires_photo: item.requires_photo,
          requires_video: item.requires_video,
          requires_doc: item.requires_doc,
          requires_comment: item.requires_comment,
        })),
      };

      if (editId) {
        await api.put(`/assessments/checklists/${editId}`, payload);
        toast.success("Checklist updated successfully");
      } else {
        await api.post("/assessments/checklists", payload);
        toast.success("Checklist saved successfully");
      }

      navigate("/checklists");
    } catch (error) {
      toast.error("Failed to save checklist");
    }
  };

  const filteredQuestions = globalQuestions.filter((q) =>
    q.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {editId ? "Edit Checklist" : "Checklist Builder"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and organize your operational checklists.
          </p>
        </div>
      </div>

      {/* Form Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Checklist Title</label>
          <Input
            value={checklistTitle}
            onChange={(e) => setChecklistTitle(e.target.value)}
            placeholder="Enter checklist name..."
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Industry</label>
          <Input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g., Manufacturing"
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Company</label>
          <Select
            value={companyId?.toString() || "none"}
            onValueChange={(v) => setCompanyId(v === "none" ? null : parseInt(v))}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Question Bank */}
        <Card className="lg:col-span-5 border-border h-[600px] flex flex-col">
          <CardHeader className="pb-3 border-b bg-secondary/20">
            <CardTitle className="text-lg">Question Bank</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            <div className="divide-y">
              {filteredQuestions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {globalQuestions.length === 0 ? (
                    <p>No questions in the bank. Add questions in Question Bank first.</p>
                  ) : (
                    <p>No questions match your search.</p>
                  )}
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const isSelected = selectedIds.has(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleQuestionSelection(q)}
                      className={`p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                        isSelected ? "bg-primary/10" : "hover:bg-secondary/50"
                      }`}
                    >
                      <div className="mt-0.5">
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${isSelected ? "font-medium" : ""}`}>
                          {q.text}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {q.response_type}
                          </Badge>
                          {q.category && (
                            <Badge variant="secondary" className="text-xs">
                              {q.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: Composer */}
        <Card className="lg:col-span-7 border-border h-[600px] flex flex-col shadow-md">
          <CardHeader className="pb-3 border-b bg-primary/5 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Checklist Composer
                <Badge variant="default" className="text-xs">
                  {composerItems.length} Items
                </Badge>
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setComposerItems([]);
                  setSelectedIds(new Set());
                }}
              >
                Clear All
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => setPreviewOpen(true)}
                disabled={composerItems.length === 0}
              >
                <Eye className="h-4 w-4 mr-2" /> Preview
              </Button>
              <Button size="sm" onClick={handleSave}>
                {editId ? "Update" : "Save"} Checklist
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 overflow-y-auto flex-1 bg-secondary/5 space-y-3">
            {composerItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <Plus className="h-8 w-8 text-border" />
                <p>Select questions from the bank to start building.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={composerItems.map((i) => i.question_id)}
                  strategy={verticalListSortingStrategy}
                >
                  {composerItems.map((item, index) => (
                    <SortableItem
                      key={item.question_id}
                      item={item}
                      index={index}
                      onRemove={handleRemoveItem}
                      onToggleRule={toggleRule}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      <ChecklistPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={checklistTitle}
        items={composerItems}
      />
    </div>
  );
}
