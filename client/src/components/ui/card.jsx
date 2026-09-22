import React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("glass-card rounded-2xl", className)} {...props} />);
Card.displayName = "Card";
export const CardHeader = ({ className, ...props }) => <div className={cn("p-5 pb-2", className)} {...props} />;
export const CardTitle = ({ className, ...props }) => <h3 className={cn("text-main font-semibold tracking-tight", className)} {...props} />;
export const CardDescription = ({ className, ...props }) => <p className={cn("text-muted text-sm", className)} {...props} />;
export const CardContent = ({ className, ...props }) => <div className={cn("p-5 pt-0", className)} {...props} />;
