import React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef(({ className, ...props }, ref) => <textarea ref={ref} className={cn("glass-field flex min-h-24 w-full rounded-xl px-3 py-2 text-sm outline-none", className)} {...props} />);
Textarea.displayName = "Textarea";
