import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong while loading bookings",
  message = "An error occurred while communicating with the server. Please check your connection and try again.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-rose-200 dark:border-rose-900/40 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-950 dark:text-rose-200 mb-1">{title}</h3>
      <p className="text-sm text-rose-700/80 dark:text-rose-300/80 max-w-md mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          leftIcon={<RotateCcw className="w-4 h-4" />}
          className="border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50"
        >
          Try again
        </Button>
      )}
    </div>
  );
}
