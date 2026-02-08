"use client";

import { IconCalendar } from "@tabler/icons-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
    let val = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    // Issue #28: Auto-format - Remove all non-numeric characters first
    const numbersOnly = val.replace(/\D/g, "");

    // Issue #28: Auto-insert "/" separators as user types
    let formatted = "";
    if (numbersOnly.length > 0) {
      // Add day (max 2 digits)
      formatted = numbersOnly.substring(0, 2);

      // Add "/" and month (max 2 digits)
      if (numbersOnly.length >= 3) {
        formatted += "/" + numbersOnly.substring(2, 4);
      }

      // Add "/" and year (max 4 digits)
      if (numbersOnly.length >= 5) {
        formatted += "/" + numbersOnly.substring(4, 8);
      }
    }

    setInputValue(formatted);

    // Try to parse and validate date
    const parts = formatted.split("/");
    if (parts.length === 3 && parts[2].length >= 2) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed
      let year = parseInt(parts[2], 10);

      // Issue #28: Support 2-digit year (yy → yyyy)
      if (parts[2].length === 2) {
        // Assume 20xx for years 00-99
        year += 2000;
      }

      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
        const date = new Date(year, month, day);
        // Validate that the date is real (e.g., not 31/02/2026)
        if (
          !Number.isNaN(date.getTime()) &&
          date.getDate() === day &&
          date.getMonth() === month &&
          date.getFullYear() === year
        ) {
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
      <PopoverContent
        className="w-auto p-0"
        align="start"
        disablePositionUpdate={true}
      >
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

type CalendarView = "days" | "months" | "years";

function MiniCalendar({ selected, onSelect, disabled }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected || new Date(),
  );
  const [view, setView] = React.useState<CalendarView>("days");

  const monthStart = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const monthEnd = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
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
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const handlePrevYear = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1),
    );
  };

  const handleNextYear = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1),
    );
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onSelect?.(today);
  };

  const handleYearSelect = (year: number) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setView("months");
  };

  const handleMonthSelect = (month: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), month, 1));
    setView("days");
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

  // Generate years range (current year ± 50 years)
  const currentYear = currentMonth.getFullYear();
  const yearsRange = Array.from(
    { length: 101 },
    (_, i) => currentYear - 50 + i,
  );

  // Month names
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {view === "days" && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevYear}
              disabled={disabled}
              type="button"
              title="Năm trước"
            >
              ««
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
              disabled={disabled}
              type="button"
              title="Tháng trước"
            >
              ←
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("years")}
              disabled={disabled}
              type="button"
              className="text-sm font-medium hover:bg-accent"
            >
              {format(currentMonth, "MMMM yyyy", { locale: vi })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              disabled={disabled}
              type="button"
              title="Tháng sau"
            >
              →
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextYear}
              disabled={disabled}
              type="button"
              title="Năm sau"
            >
              »»
            </Button>
          </>
        )}
        {view === "years" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("days")}
              disabled={disabled}
              type="button"
            >
              ← Trở lại
            </Button>
            <div className="text-sm font-medium">Chọn năm</div>
            <div className="w-8" /> {/* Spacer */}
          </>
        )}
        {view === "months" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("years")}
              disabled={disabled}
              type="button"
            >
              ← Trở lại
            </Button>
            <div className="text-sm font-medium">{currentYear}</div>
            <div className="w-8" /> {/* Spacer */}
          </>
        )}
      </div>

      {/* Days view */}
      {view === "days" && (
        <>
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
            {days.map((day) => (
              <Button
                key={day.getTime()}
                variant="ghost"
                size="sm"
                disabled={disabled}
                type="button"
                onClick={() => onSelect?.(day)}
                className={cn(
                  "h-8 w-8 p-0 font-normal",
                  !isCurrentMonth(day) && "text-muted-foreground opacity-50",
                  isToday(day) && "bg-accent",
                  isSelected(day) &&
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
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
        </>
      )}

      {/* Years view */}
      {view === "years" && (
        <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
          {yearsRange.map((year) => (
            <Button
              key={year}
              variant="ghost"
              size="sm"
              disabled={disabled}
              type="button"
              onClick={() => handleYearSelect(year)}
              className={cn(
                "h-10 font-normal",
                year === currentYear && "bg-accent font-medium",
                selected &&
                  year === selected.getFullYear() &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
            >
              {year}
            </Button>
          ))}
        </div>
      )}

      {/* Months view */}
      {view === "months" && (
        <div className="grid grid-cols-3 gap-2">
          {monthNames.map((monthName, index) => (
            <Button
              key={monthName}
              variant="ghost"
              size="sm"
              disabled={disabled}
              type="button"
              onClick={() => handleMonthSelect(index)}
              className={cn(
                "h-12 font-normal",
                index === currentMonth.getMonth() && "bg-accent font-medium",
                selected &&
                  index === selected.getMonth() &&
                  currentYear === selected.getFullYear() &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
            >
              {monthName}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
