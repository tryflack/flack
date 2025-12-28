"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon } from "lucide-react";
import { cn } from "@flack/ui/lib/utils";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

interface OnboardingStepsProps {
  steps: OnboardingStep[];
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
  className?: string;
}

export function OnboardingSteps({
  steps,
  currentStep,
  onStepClick,
  className,
}: OnboardingStepsProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isFuture = stepNumber > currentStep;
        const isLast = index === steps.length - 1;
        const isClickable = isCompleted && onStepClick;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className={cn(
              "relative flex gap-4",
              isClickable && "cursor-pointer group"
            )}
            onClick={isClickable ? () => onStepClick(stepNumber) : undefined}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={
              isClickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onStepClick(stepNumber);
                    }
                  }
                : undefined
            }
          >
            {/* Animated vertical line connector */}
            {!isLast && (
              <div className="absolute left-[17px] top-[36px] h-[calc(100%-20px)] w-[2px] bg-muted-foreground/20">
                <motion.div
                  className="w-full bg-emerald-500 origin-top"
                  initial={{ scaleY: 0 }}
                  animate={{
                    scaleY: isCompleted ? 1 : isCurrent ? 0.5 : 0,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                    delay: isCompleted ? 0 : 0.2,
                  }}
                  style={{ height: "100%" }}
                />
              </div>
            )}

            {/* Step indicator circle */}
            <div className="relative z-10 shrink-0">
              <motion.div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-medium",
                  isCompleted &&
                    "border-emerald-500 bg-emerald-500 text-white group-hover:bg-emerald-600 group-hover:border-emerald-600",
                  isCurrent &&
                    "border-primary bg-primary text-primary-foreground",
                  isFuture &&
                    "border-muted-foreground/30 bg-background text-muted-foreground/50"
                )}
                initial={false}
                animate={{
                  scale: isCurrent ? 1 : 1,
                  boxShadow: isCurrent
                    ? "0 0 0 4px rgba(var(--primary), 0.15), 0 4px 12px rgba(var(--primary), 0.25)"
                    : "none",
                }}
                whileHover={isClickable ? { scale: 1.05 } : undefined}
                whileTap={isClickable ? { scale: 0.95 } : undefined}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    >
                      <CheckIcon className="h-4 w-4" strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <motion.span
                      key="number"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    >
                      {stepNumber}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Step content */}
            <motion.div
              className={cn("flex-1 pb-8", isLast && "pb-0")}
              initial={false}
              animate={{
                opacity: isFuture ? 0.5 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <motion.h3
                className={cn(
                  "font-semibold leading-tight",
                  isCompleted && "text-foreground group-hover:text-emerald-600",
                  isCurrent && "text-foreground",
                  isFuture && "text-muted-foreground/60"
                )}
                initial={false}
                animate={{
                  x: isCurrent ? 0 : 0,
                }}
                transition={{ duration: 0.2 }}
              >
                {step.title}
              </motion.h3>
              <motion.p
                className={cn(
                  "mt-1 text-sm leading-relaxed",
                  isCompleted && "text-muted-foreground",
                  isCurrent && "text-muted-foreground",
                  isFuture && "text-muted-foreground/40"
                )}
                initial={false}
                animate={{
                  opacity: isFuture ? 0.6 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {step.description}
              </motion.p>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
