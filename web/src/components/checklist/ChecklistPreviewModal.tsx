import { Camera, Video, FileText, MessageSquare, PenLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface ComposerItem {
  question_id: number;
  text: string;
  response_type?: string;
  is_critical: boolean;
  requires_photo: boolean;
  requires_video: boolean;
  requires_doc: boolean;
  requires_comment: boolean;
}

interface ChecklistPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: ComposerItem[];
}

export default function ChecklistPreviewModal({
  open,
  onOpenChange,
  title,
  items,
}: ChecklistPreviewModalProps) {
  const completedCount = Math.floor(items.length * 0.3); // Mock 30% completion
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] p-0 gap-0 max-h-[90vh]">
        <DialogHeader className="p-0">
          {/* Mobile Header */}
          <div className="bg-primary text-primary-foreground p-4 rounded-t-lg">
            <DialogTitle className="text-white text-lg font-semibold">
              {title || "Untitled Checklist"}
            </DialogTitle>
            <p className="text-primary-foreground/80 text-sm mt-1">
              Mobile Preview
            </p>
          </div>

          {/* Progress Section */}
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Completion Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedCount}/{items.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        {/* Questions List */}
        <div className="overflow-y-auto max-h-[50vh] p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No questions added yet
            </div>
          ) : (
            items.map((item, index) => (
              <div key={item.question_id} className="border rounded-lg p-4 space-y-3">
                {/* Question Header */}
                <div className="flex items-start gap-2">
                  <span className="text-sm font-bold text-muted-foreground">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-snug">{item.text}</p>
                    {item.is_critical && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        Critical
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Response Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-10 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                    disabled
                  >
                    Yes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled
                  >
                    No
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-10"
                    disabled
                  >
                    NA
                  </Button>
                </div>

                {/* Remark Field (shown for demonstration) */}
                {index === 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <label className="text-xs font-medium text-muted-foreground">
                      Remark (Required for NO)
                    </label>
                    <Textarea
                      placeholder="Enter remarks here..."
                      className="min-h-[60px] text-sm"
                      disabled
                    />
                  </div>
                )}

                {/* Evidence Requirements */}
                {(item.requires_photo || item.requires_video || item.requires_doc || item.requires_comment) && (
                  <div className="flex gap-2 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Evidence:</span>
                    {item.requires_photo && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Camera className="h-3 w-3" /> Photo
                      </Badge>
                    )}
                    {item.requires_video && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Video className="h-3 w-3" /> Video
                      </Badge>
                    )}
                    {item.requires_doc && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <FileText className="h-3 w-3" /> Doc
                      </Badge>
                    )}
                    {item.requires_comment && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <MessageSquare className="h-3 w-3" /> Comment
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-3">
          {/* Signature Section */}
          <div className="border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <PenLine className="h-4 w-4" />
              <span>Officer Signature</span>
            </div>
            <div className="mt-2 h-16 border-2 border-dashed rounded-md flex items-center justify-center text-xs text-muted-foreground">
              Tap to sign
            </div>
          </div>

          {/* Submit Button */}
          <Button className="w-full" size="lg" disabled>
            Submit Checklist
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            This is a preview. Submission is disabled.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
