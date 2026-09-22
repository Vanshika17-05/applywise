import React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef(({ className, ...props }, ref) => <LabelPrimitive.Root ref={ref} className={cn("text-muted mb-2 block text-xs font-semibold uppercase tracking-[.12em]", className)} {...props} />);
Label.displayName = "Label";
