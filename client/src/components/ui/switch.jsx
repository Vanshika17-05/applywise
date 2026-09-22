import React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export const Switch = React.forwardRef(({ className, ...props }, ref) =>
  <SwitchPrimitive.Root ref={ref} className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-theme bg-[var(--glass-soft)] transition-colors data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--page)] disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>
    <SwitchPrimitive.Thumb className="block size-4 translate-x-1 rounded-full bg-[var(--text)] shadow-sm transition-transform data-[state=checked]:translate-x-6 data-[state=checked]:bg-[var(--accent-foreground)]" />
  </SwitchPrimitive.Root>
);
Switch.displayName = "Switch";
