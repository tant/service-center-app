"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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

export interface MultiSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  [key: string]: any;
}

interface MultiSelectComboboxProps {
  options: MultiSelectOption[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxDisplayItems?: number;
  disabled?: boolean;
  className?: string;
  renderOption?: (option: MultiSelectOption) => React.ReactNode;
  renderBadge?: (option: MultiSelectOption) => React.ReactNode;
}

export function MultiSelectCombobox({
  options,
  selected,
  onSelectionChange,
  placeholder = "Chọn các mục...",
  searchPlaceholder = "Tìm kiếm...",
  emptyMessage = "Không tìm thấy mục nào.",
  maxDisplayItems = 3,
  disabled = false,
  className,
  renderOption,
  renderBadge,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const selectedOptions = React.useMemo(
    () => options.filter((option) => selected.includes(option.value)),
    [options, selected]
  );

  const availableOptions = React.useMemo(
    () => options.filter((option) => !selected.includes(option.value)),
    [options, selected]
  );

  const filteredOptions = React.useMemo(
    () =>
      availableOptions.filter((option) =>
        option.label.toLowerCase().includes(searchValue.toLowerCase())
      ),
    [availableOptions, searchValue]
  );

  const handleSelect = React.useCallback(
    (option: MultiSelectOption) => {
      if (option.disabled) return;

      onSelectionChange([...selected, option.value]);
      setSearchValue("");
    },
    [selected, onSelectionChange]
  );

  const handleRemove = React.useCallback(
    (value: string) => {
      onSelectionChange(selected.filter((item) => item !== value));
    },
    [selected, onSelectionChange]
  );

  const handleClear = React.useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  const displayItems = selectedOptions.slice(0, maxDisplayItems);
  const remainingCount = selectedOptions.length - maxDisplayItems;

  const defaultRenderOption = (option: MultiSelectOption) => (
    <div className="flex items-center justify-between w-full">
      <span className={cn(option.disabled && "text-muted-foreground")}>
        {option.label}
      </span>
      {option.disabled && (
        <Badge variant="secondary" className="text-xs">
          Không khả dụng
        </Badge>
      )}
    </div>
  );

  const defaultRenderBadge = (option: MultiSelectOption) => (
    <Badge
      variant="secondary"
      className="text-xs font-normal gap-1 pr-1 max-w-[150px] my-0.5"
    >
      <span className="truncate">{option.label}</span>
      <button
        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleRemove(option.value);
          }
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={() => handleRemove(option.value)}
      >
        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </button>
    </Badge>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal min-h-10 h-auto py-2",
            !selectedOptions.length && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap items-center gap-1 flex-1 text-sm min-h-6">
            {selectedOptions.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              <>
                {displayItems.map((option) => (
                  <React.Fragment key={option.value}>
                    {renderBadge ? renderBadge(option) : defaultRenderBadge(option)}
                  </React.Fragment>
                ))}
                {remainingCount > 0 && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    +{remainingCount} mục khác
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="flex items-start gap-1 mt-1">
            {selectedOptions.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command>
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
                      onSelect={() => handleSelect(option)}
                      disabled={option.disabled}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected.includes(option.value)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {renderOption ? renderOption(option) : defaultRenderOption(option)}
                    </CommandItem>
                  ))}
                </div>
              </CommandGroup>
            )}
            {selectedOptions.length > 0 && (
              <CommandGroup heading="Đã chọn">
                <div className="max-h-[200px] overflow-y-auto">
                  {selectedOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleRemove(option.value)}
                      className="cursor-pointer"
                    >
                      <X className="mr-2 h-4 w-4 text-muted-foreground" />
                      {renderOption ? renderOption(option) : defaultRenderOption(option)}
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