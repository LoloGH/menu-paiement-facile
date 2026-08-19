
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ImagePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  itemName: string;
}

export const ImagePreviewDialog: React.FC<ImagePreviewDialogProps> = ({
  isOpen,
  onClose,
  imageUrl,
  itemName,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{itemName}</DialogTitle>
        </DialogHeader>
        <AspectRatio ratio={16 / 9} className="bg-muted">
          <img
            src={imageUrl}
            alt={itemName}
            className="object-cover w-full h-full rounded-md"
          />
        </AspectRatio>
      </DialogContent>
    </Dialog>
  );
};
