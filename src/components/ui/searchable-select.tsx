"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SearchableSelectOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
  [key: string]: any;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  renderOption?: (option: SearchableSelectOption) => React.ReactNode;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Chọn một mục...",
  searchPlaceholder = "Tìm kiếm...",
  emptyMessage = "Không tìm thấy mục nào.",
  disabled = false,
  className,
  renderOption,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const filteredOptions = React.useMemo(
    () =>
      options.filter((option) => {
        const searchLower = searchValue.toLowerCase();

        // Search in main label and description
        if (
          option.label.toLowerCase().includes(searchLower) ||
          option.description?.toLowerCase().includes(searchLower)
        ) {
          return true;
        }

        // Search in additional fields (brand, model, sku, type, etc.)
        const searchableFields = ["brand", "model", "sku", "type"];
        return searchableFields.some((field) =>
          option[field]?.toString().toLowerCase().includes(searchLower),
        );
      }),
    [options, searchValue],
  );

  const handleSelect = React.useCallback(
    (selectedValue: string) => {
      if (selectedValue === value) {
        onValueChange("");
      } else {
        onValueChange(selectedValue);
      }
      setOpen(false);
      setSearchValue("");
    },
    [value, onValueChange],
  );

  const defaultRenderOption = (option: SearchableSelectOption) => (
    <div className="flex flex-col items-start w-full">
      <span
        className={cn(
          "font-medium",
          option.disabled && "text-muted-foreground",
        )}
      >
        {option.label}
      </span>
      {option.description && (
        <span className="text-xs text-muted-foreground">
          {option.description}
        </span>
      )}
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal h-auto py-2",
            !selectedOption && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <div className="flex flex-col items-start flex-1 min-h-6">
            {selectedOption ? (
              renderOption ? (
                renderOption(selectedOption)
              ) : (
                defaultRenderOption(selectedOption)
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {filteredOptions.length > 0 && (
              <CommandGroup>
                <div className="max-h-[300px] overflow-y-auto">
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                      disabled={option.disabled}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {renderOption
                        ? renderOption(option)
                        : defaultRenderOption(option)}
                    </CommandItem>
                  ))}
                </div>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
