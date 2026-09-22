import React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef(({ className, type = "text", ...props }, ref) => <input ref={ref} type={type} className={cn("glass-field flex h-10 w-full rounded-xl px-3 py-2 text-sm outline-none disabled:opacity-50", className)} {...props} />);
Input.displayName = "Input";
