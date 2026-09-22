import React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 8, ...props }, ref) =>
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content ref={ref} sideOffset={sideOffset} className={cn("glass-strong account-menu z-50 min-w-48 rounded-2xl p-1.5 shadow-xl outline-none", className)} {...props} />
  </DropdownMenuPrimitive.Portal>
);
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuLabel = ({ className, ...props }) =>
  <DropdownMenuPrimitive.Label className={cn("px-3 py-2", className)} {...props} />;

export const DropdownMenuSeparator = ({ className, ...props }) =>
  <DropdownMenuPrimitive.Separator className={cn("my-1 h-px bg-[var(--stroke)]", className)} {...props} />;

export const DropdownMenuItem = React.forwardRef(({ className, ...props }, ref) =>
  <DropdownMenuPrimitive.Item ref={ref} className={cn("flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-sm text-main outline-none data-[highlighted]:bg-accent-soft data-[disabled]:cursor-default data-[disabled]:opacity-45", className)} {...props} />
);
DropdownMenuItem.displayName = "DropdownMenuItem";
