#!/usr/bin/env bash
# ============================================
# Stack Management Script
# ============================================
# Manages Supabase infrastructure and App stacks independently
#
# Usage:
#   ./manage-stack.sh supabase start     # Start Supabase only
#   ./manage-stack.sh app start          # Start App only
#   ./manage-stack.sh all start          # Start both (Supabase first, then App)
#   ./manage-stack.sh supabase stop      # Stop Supabase
#   ./manage-stack.sh app stop           # Stop App
#   ./manage-stack.sh all stop           # Stop both
#   ./manage-stack.sh supabase logs      # View Supabase logs
#   ./manage-stack.sh app logs           # View App logs
#   ./manage-stack.sh status             # Show status of all services

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# File paths
SUPABASE_COMPOSE="docker-compose.supabase.yml"
APP_COMPOSE="docker-compose.app.yml"
SUPABASE_ENV=".env.supabase"
APP_ENV=".env.app"

# ============================================
# Helper Functions
# ============================================

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if .env files exist
check_env_files() {
    local missing=0

    if [ ! -f "$SUPABASE_ENV" ]; then
        print_warning "Missing $SUPABASE_ENV - copy from .env.supabase.example"
        missing=1
    fi

    if [ ! -f "$APP_ENV" ]; then
        print_warning "Missing $APP_ENV - copy from .env.app.example"
        missing=1
    fi

    if [ $missing -eq 1 ]; then
        print_info "Run: cp .env.supabase.example .env.supabase && cp .env.app.example .env.app"
        return 1
    fi

    return 0
}

# ============================================
# Supabase Stack Operations
# ============================================

supabase_start() {
    print_header "Starting Supabase Infrastructure"

    if [ ! -f "$SUPABASE_ENV" ]; then
        print_error "$SUPABASE_ENV not found"
        exit 1
    fi

    docker compose -f "$SUPABASE_COMPOSE" --env-file "$SUPABASE_ENV" up -d

    print_success "Supabase infrastructure started"
    print_info "Kong Gateway: http://localhost:8000"
    print_info "Supabase Studio: http://localhost:3000"
}

supabase_stop() {
    print_header "Stopping Supabase Infrastructure"
    docker compose -f "$SUPABASE_COMPOSE" down
    print_success "Supabase infrastructure stopped"
}

supabase_logs() {
    docker compose -f "$SUPABASE_COMPOSE" logs -f "${@:2}"
}

supabase_status() {
    print_header "Supabase Infrastructure Status"
    docker compose -f "$SUPABASE_COMPOSE" ps
}

# ============================================
# App Stack Operations
# ============================================

app_start() {
    print_header "Starting Service Center App"

    if [ ! -f "$APP_ENV" ]; then
        print_error "$APP_ENV not found"
        exit 1
    fi

    # Check if Supabase network exists
    if ! docker network ls | grep -q "supabase-public"; then
        print_error "Supabase network not found. Start Supabase stack first:"
        print_info "./manage-stack.sh supabase start"
        exit 1
    fi

    docker compose -f "$APP_COMPOSE" --env-file "$APP_ENV" up -d

    print_success "Service Center App started"
    print_info "Application: http://localhost:3025"
}

app_stop() {
    print_header "Stopping Service Center App"
    docker compose -f "$APP_COMPOSE" down
    print_success "Service Center App stopped"
}

app_logs() {
    docker compose -f "$APP_COMPOSE" logs -f "${@:2}"
}

app_status() {
    print_header "Application Status"
    docker compose -f "$APP_COMPOSE" ps
}

app_rebuild() {
    print_header "Rebuilding Service Center App"
    docker compose -f "$APP_COMPOSE" --env-file "$APP_ENV" build --no-cache
    print_success "App rebuilt successfully"
}

# ============================================
# Combined Operations
# ============================================

all_start() {
    print_header "Starting Complete Stack (Supabase + App)"

    check_env_files || exit 1

    # Start Supabase first
    supabase_start

    # Wait for Supabase to be healthy
    print_info "Waiting for Supabase to be ready..."
    sleep 10

    # Check Kong health
    local retries=0
    local max_retries=30
    while [ $retries -lt $max_retries ]; do
        if docker exec supabase-kong kong health &>/dev/null; then
            print_success "Supabase is healthy"
            break
        fi
        retries=$((retries + 1))
        echo -n "."
        sleep 2
    done
    echo ""

    if [ $retries -eq $max_retries ]; then
        print_error "Supabase failed to become healthy"
        exit 1
    fi

    # Start App
    app_start

    print_success "Complete stack started successfully"
    echo ""
    print_info "🚀 Services:"
    print_info "   Application:      http://localhost:3025"
    print_info "   API Gateway:      http://localhost:8000"
    print_info "   Supabase Studio:  http://localhost:3000"
}

all_stop() {
    print_header "Stopping Complete Stack"
    app_stop
    supabase_stop
    print_success "Complete stack stopped"
}

all_status() {
    supabase_status
    echo ""
    app_status
}

# ============================================
# Utility Operations
# ============================================

show_status() {
    all_status
}

show_logs() {
    print_header "Showing All Logs (Ctrl+C to exit)"
    docker compose -f "$SUPABASE_COMPOSE" logs -f &
    SUPABASE_PID=$!
    docker compose -f "$APP_COMPOSE" logs -f &
    APP_PID=$!

    wait $SUPABASE_PID $APP_PID
}

show_help() {
    cat << EOF
${BLUE}Stack Management Script${NC}

${YELLOW}Usage:${NC}
  ./manage-stack.sh <stack> <command> [options]

${YELLOW}Stacks:${NC}
  supabase     Supabase infrastructure only
  app          Application only
  all          Both stacks (recommended)

${YELLOW}Commands:${NC}
  start        Start the stack(s)
  stop         Stop the stack(s)
  restart      Restart the stack(s)
  logs         View logs (-f to follow)
  status       Show container status
  rebuild      Rebuild app image (app stack only)

${YELLOW}Examples:${NC}
  ./manage-stack.sh all start              # Start everything
  ./manage-stack.sh supabase logs -f       # Follow Supabase logs
  ./manage-stack.sh app rebuild            # Rebuild app
  ./manage-stack.sh status                 # Show all statuses

${YELLOW}Shortcuts:${NC}
  ./manage-stack.sh status                 # Global status
  ./manage-stack.sh logs                   # All logs

${YELLOW}Environment Files:${NC}
  .env.supabase    Supabase configuration
  .env.app         Application configuration

${YELLOW}First Time Setup:${NC}
  1. cp .env.supabase.example .env.supabase
  2. cp .env.app.example .env.app
  3. Edit both files with your configuration
  4. ./manage-stack.sh all start

EOF
}

# ============================================
# Main Script Logic
# ============================================

# Parse arguments
STACK="${1:-help}"
COMMAND="${2:-help}"

case "$STACK" in
    supabase)
        case "$COMMAND" in
            start) supabase_start ;;
            stop) supabase_stop ;;
            restart) supabase_stop && supabase_start ;;
            logs) supabase_logs "$@" ;;
            status) supabase_status ;;
            *) show_help ;;
        esac
        ;;

    app)
        case "$COMMAND" in
            start) app_start ;;
            stop) app_stop ;;
            restart) app_stop && app_start ;;
            logs) app_logs "$@" ;;
            status) app_status ;;
            rebuild) app_rebuild ;;
            *) show_help ;;
        esac
        ;;

    all)
        case "$COMMAND" in
            start) all_start ;;
            stop) all_stop ;;
            restart) all_stop && all_start ;;
            status) all_status ;;
            *) show_help ;;
        esac
        ;;

    status)
        show_status
        ;;

    logs)
        show_logs
        ;;

    help|--help|-h)
        show_help
        ;;

    *)
        print_error "Unknown stack: $STACK"
        echo ""
        show_help
        exit 1
        ;;
esac
