import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { motion } from "framer-motion";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] select-none", {
  variants: {
    variant: {
      default: "btn-primary",
      secondary: "btn-secondary",
      ghost: "btn-ghost",
      outline: "btn-outline",
      destructive: "btn-danger"
    },
    size: { default: "h-10 px-4 py-2", sm: "h-8 rounded-lg px-3 text-xs", lg: "h-11 px-5", icon: "size-9" }
  },
  defaultVariants: { variant: "default", size: "default" }
});

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  if (asChild) {
    return <Slot className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  }
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";
export { Button, buttonVariants };
