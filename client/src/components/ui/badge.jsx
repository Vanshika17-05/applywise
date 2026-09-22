import { cn } from "@/lib/utils";

export function Badge({ className, ...props }) {
  return <span className={cn("glass-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none", className)} {...props} />;
}
