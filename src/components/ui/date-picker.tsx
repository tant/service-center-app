"use client";

import * as React from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { IconCalendar } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string; // ISO date string or empty
  onChange?: (value: string) => void; // ISO date string
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  disabled,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // Convert ISO date to dd/mm/yyyy for display
  React.useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          setInputValue(format(date, "dd/MM/yyyy"));
        }
      } catch (_e) {
        setInputValue("");
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Try to parse dd/mm/yyyy format
    const parts = val.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      const year = parseInt(parts[2], 10);

      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
        const date = new Date(year, month, day);
        if (!Number.isNaN(date.getTime())) {
          // Valid date, convert to ISO string (YYYY-MM-DD)
          const isoString = format(date, "yyyy-MM-dd");
          onChange?.(isoString);
        }
      }
    }
  };

  const handleDateSelect = (date: Date) => {
    const isoString = format(date, "yyyy-MM-dd");
    onChange?.(isoString);
    setOpen(false);
  };

  const selectedDate = value ? new Date(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <Input
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            type="button"
          >
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <MiniCalendar
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}

// Simple mini calendar component
interface MiniCalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  disabled?: boolean;
}

function MiniCalendar({ selected, onSelect, disabled }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected || new Date()
  );

  const monthStart = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const monthEnd = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );

  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onSelect?.(today);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selected) return false;
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevMonth}
          disabled={disabled}
          type="button"
        >
          ←
        </Button>
        <div className="text-sm font-medium">
          {format(currentMonth, "MMMM yyyy", { locale: vi })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          disabled={disabled}
          type="button"
        >
          →
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => (
          <Button
            key={idx}
            variant="ghost"
            size="sm"
            disabled={disabled}
            type="button"
            onClick={() => onSelect?.(day)}
            className={cn(
              "h-8 w-8 p-0 font-normal",
              !isCurrentMonth(day) && "text-muted-foreground opacity-50",
              isToday(day) && "bg-accent",
              isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            )}
          >
            {day.getDate()}
          </Button>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          disabled={disabled}
          className="w-full"
          type="button"
        >
          Hôm nay
        </Button>
      </div>
    </div>
  );
}
