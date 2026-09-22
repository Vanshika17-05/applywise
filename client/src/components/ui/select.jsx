import React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => <SelectPrimitive.Trigger ref={ref} className={cn("glass-field flex h-10 w-full items-center justify-between rounded-xl px-3 text-sm outline-none", className)} {...props}>{children}<SelectPrimitive.Icon><ChevronDown size={15} className="text-subtle" /></SelectPrimitive.Icon></SelectPrimitive.Trigger>);
SelectTrigger.displayName = "SelectTrigger";
export const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => <SelectPrimitive.Portal><SelectPrimitive.Content ref={ref} position="popper" sideOffset={6} className={cn("glass-strong z-[60] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl p-1", className)} {...props}><SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport></SelectPrimitive.Content></SelectPrimitive.Portal>);
SelectContent.displayName = "SelectContent";
export const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => <SelectPrimitive.Item ref={ref} className={cn("relative flex cursor-pointer items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none focus:bg-[var(--accent-muted)] focus:text-[var(--text)]", className)} {...props}><span className="absolute left-2"><SelectPrimitive.ItemIndicator><Check size={14} /></SelectPrimitive.ItemIndicator></span><SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText></SelectPrimitive.Item>);
SelectItem.displayName = "SelectItem";
