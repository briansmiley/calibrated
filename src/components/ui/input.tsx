import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "underline"
}

function Input({ className, type, variant = "default", ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-transparent min-w-0 text-base transition-colors outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // File input styles
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Variant styles
        variant === "default" && [
          "dark:bg-input/30 border-input h-9 w-full rounded-md border px-3 py-1 shadow-xs md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        ],
        variant === "underline" && [
          "border-b border-muted-foreground/30 py-1",
          "focus:border-primary",
        ],
        className
      )}
      {...props}
    />
  )
}

export { Input }
