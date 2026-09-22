import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export function DialogContent({ className, overlayClassName, children, ...props }) {
  return <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className={cn("dialog-overlay fixed inset-0 z-50", overlayClassName)} />
    <DialogPrimitive.Content className={cn("glass-strong fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(94vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl p-6 focus:outline-none", className)} {...props}>
      {children}
      <DialogPrimitive.Close aria-label="Close dialog" className="glass-action absolute right-5 top-5 rounded-lg p-1"><X size={18} /></DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>;
}
