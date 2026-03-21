import { useNavigate } from "react-router-dom";
import { Edit, Trash2, MoreHorizontal, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Checklist {
  id: number;
  title: string;
  industry: string | null;
  company_name: string | null;
  is_active: boolean;
  question_count: number;
  created_at: string | null;
}

interface ChecklistCardProps {
  checklist: Checklist;
  onToggleActive: (id: number) => void;
  onDelete: (checklist: Checklist) => void;
}

export default function ChecklistCard({ checklist, onToggleActive, onDelete }: ChecklistCardProps) {
  const navigate = useNavigate();

  return (
    <Card className={`border-border transition-all ${!checklist.is_active ? "opacity-60" : ""}`}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base leading-tight">{checklist.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {checklist.question_count} questions
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/composer?edit=${checklist.id}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(checklist)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-wrap gap-2 mb-4">
          {checklist.industry && (
            <Badge variant="secondary" className="text-xs">
              {checklist.industry}
            </Badge>
          )}
          {checklist.company_name && (
            <Badge variant="outline" className="text-xs">
              {checklist.company_name}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {checklist.created_at
              ? new Date(checklist.created_at).toLocaleDateString()
              : ""}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {checklist.is_active ? "Active" : "Inactive"}
            </span>
            <Switch
              checked={checklist.is_active}
              onCheckedChange={() => onToggleActive(checklist.id)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
