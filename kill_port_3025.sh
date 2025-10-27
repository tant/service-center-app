#!/usr/bin/env bash
# kill_port_3025.sh
# Find and kill processes listening on TCP port 3025.
# Usage: ./kill_port_3025.sh

set -euo pipefail

PORT=3025

echo "Searching for processes listening on port $PORT..."

# Attempt to find PIDs using ss, then lsof, then netstat as fallback
PIDS=()

# Use ss if available
if command -v ss >/dev/null 2>&1; then
  while IFS= read -r line; do
    # line looks like: LISTEN 0 511 *:3025 *:* users:(("next-server (v15.5.4)",pid=50340,fd=23))
    pid=$(echo "$line" | grep -oP 'pid=\K[0-9]+' || true)
    if [[ -n "$pid" ]]; then
      PIDS+=("$pid")
    fi
  done < <(ss -ltnp 2>/dev/null | grep -E ":${PORT}( |$)" || true)
fi

# If none found, try lsof
if [[ ${#PIDS[@]} -eq 0 ]] && command -v lsof >/dev/null 2>&1; then
  while IFS= read -r pid; do
    PIDS+=("$pid")
  done < <(lsof -iTCP:@${PORT} -sTCP:LISTEN -t 2>/dev/null || true)
fi

# If still none found, try netstat
if [[ ${#PIDS[@]} -eq 0 ]] && command -v netstat >/dev/null 2>&1; then
  while IFS= read -r pid; do
    PIDS+=("$pid")
  done < <(netstat -ltnp 2>/dev/null | grep -E ":${PORT}( |$)" | awk -F 'pid=' '{print $2}' | awk -F ',' '{print $1}' || true)
fi

if [[ ${#PIDS[@]} -eq 0 ]]; then
  echo "No processes found listening on port $PORT."
  exit 0
fi

# Deduplicate PIDs
IFS=$'\n' PIDS=($(printf "%s\n" "${PIDS[@]}" | sort -u))

echo "Found PIDs: ${PIDS[*]}"

for pid in "${PIDS[@]}"; do
  if [[ -z "$pid" ]]; then
    continue
  fi
  if ! ps -p "$pid" >/dev/null 2>&1; then
    echo "PID $pid no longer exists, skipping"
    continue
  fi

  echo "Sending SIGTERM to PID $pid..."
  kill "$pid" 2>/dev/null || true

  # Wait up to 5 seconds for process to exit
  for i in {1..5}; do
    if ! ps -p "$pid" >/dev/null 2>&1; then
      echo "PID $pid terminated"
      break
    fi
    sleep 1
  done

  if ps -p "$pid" >/dev/null 2>&1; then
    echo "PID $pid did not terminate, sending SIGKILL..."
    kill -9 "$pid" 2>/dev/null || true
    if ! ps -p "$pid" >/dev/null 2>&1; then
      echo "PID $pid killed"
    else
      echo "Failed to kill PID $pid"
    fi
  fi
done

# Final check
if ss -ltnp 2>/dev/null | grep -E ":${PORT}( |$)" >/dev/null 2>&1; then
  echo "Warning: some process still listening on port $PORT"
  ss -ltnp | grep -E ":${PORT}( |$)"
  exit 1
else
  echo "Port $PORT is now free."
fi
