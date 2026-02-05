import { useEffect, useState } from "react";

/**
 * Hook để debounce một giá trị, giúp giảm số lần re-render
 * khi giá trị thay đổi liên tục (ví dụ: user đang typing)
 *
 * @param value - Giá trị cần debounce
 * @param delay - Thời gian delay (ms), mặc định 300ms
 * @returns Giá trị đã được debounced
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebouncedValue(search, 300);
 *
 * // debouncedSearch chỉ update sau 300ms user ngừng typing
 * useEffect(() => {
 *   // API call với debouncedSearch
 * }, [debouncedSearch]);
 * ```
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout để update debounced value sau delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: clear timeout nếu value thay đổi trước khi delay hết
    // Điều này đảm bảo chỉ value cuối cùng được set
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
