"use client";

import { IconMinus, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface NumberCounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export function NumberCounter({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  disabled = false,
  className = "",
}: NumberCounterProps) {
  const handleDecrement = () => {
    const newValue = value - step;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const handleIncrement = () => {
    const newValue = value + step;
    if (!max || newValue <= max) {
      onChange(newValue);
    }
  };

  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && (!max || value < max);

  return (
    <div className={`flex items-center border rounded-md w-fit ${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 rounded-r-none border-r"
        onClick={handleDecrement}
        disabled={!canDecrement}
      >
        <IconMinus className="h-3 w-3" />
      </Button>
      <div className="h-8 px-2 flex items-center justify-center min-w-[60px] bg-background border-x-0 text-sm font-medium">
        {value}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 rounded-l-none border-l"
        onClick={handleIncrement}
        disabled={!canIncrement}
      >
        <IconPlus className="h-3 w-3" />
      </Button>
    </div>
  );
}
