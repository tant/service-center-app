#!/bin/bash

# Service Center Management - Docker Deployment Script
# This script helps deploy the full stack

set -e

echo "🚀 Service Center Management - Docker Deployment"
echo "=================================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo ""
    echo "Please create .env file from .env.docker.example:"
    echo "  cp .env.docker.example .env"
    echo "  nano .env  # Fill in your values"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker and try again"
    exit 1
fi

echo "✅ Environment check passed"
echo ""

# Ask for deployment action
echo "Select deployment action:"
echo "  1) Fresh deployment (build and start all services)"
echo "  2) Update application only (rebuild app container)"
echo "  3) Restart all services"
echo "  4) Stop all services"
echo "  5) View logs"
echo "  6) Clean up (remove containers and volumes)"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        echo ""
        echo "🏗️  Building and starting all services..."
        docker compose down
        docker compose build --no-cache
        docker compose up -d
        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "Services are starting up. Check status with:"
        echo "  docker compose ps"
        echo ""
        echo "View logs with:"
        echo "  docker compose logs -f"
        echo ""

        # Read URLs from .env
        APP_PORT=$(grep "^APP_PORT=" .env | cut -d'=' -f2)
        NEXT_PUBLIC_SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env | cut -d'=' -f2)
        SITE_URL=$(grep "^SITE_URL=" .env | cut -d'=' -f2)
        STUDIO_PORT=$(grep "^STUDIO_PORT=" .env | cut -d'=' -f2)

        echo "Access your application:"
        if [[ "$SITE_URL" == http://localhost* ]]; then
            echo "  - App: ${SITE_URL:-http://localhost:${APP_PORT:-3025}}"
            echo "  - Supabase API: ${NEXT_PUBLIC_SUPABASE_URL:-http://localhost:8000}"
            echo "  - Supabase Studio: http://localhost:${STUDIO_PORT:-3000}"
        else
            echo "  - App: ${SITE_URL}"
            echo "  - Supabase API: ${NEXT_PUBLIC_SUPABASE_URL}"
            echo "  - Supabase Studio: https://supabase.${SITE_URL#https://}"
        fi
        ;;

    2)
        echo ""
        echo "🔄 Updating application..."
        docker compose build app
        docker compose up -d app
        echo ""
        echo "✅ Application updated!"
        ;;

    3)
        echo ""
        echo "♻️  Restarting all services..."
        docker compose restart
        echo ""
        echo "✅ Services restarted!"
        ;;

    4)
        echo ""
        echo "🛑 Stopping all services..."
        docker compose down
        echo ""
        echo "✅ All services stopped!"
        ;;

    5)
        echo ""
        echo "📋 Viewing logs (Ctrl+C to exit)..."
        docker compose logs -f
        ;;

    6)
        echo ""
        read -p "⚠️  This will remove all containers and volumes. Continue? [y/N]: " confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            echo ""
            echo "🧹 Cleaning up..."
            docker compose down -v
            docker system prune -f
            echo ""
            echo "✅ Cleanup complete!"
        else
            echo "Cancelled"
        fi
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
