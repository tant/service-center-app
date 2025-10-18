#!/bin/bash

# Service Center Management - Docker Deployment Script
# Complete deployment workflow: setup -> build -> deploy -> schema

set -e

echo "🚀 Service Center Management - Docker Deployment"
echo "=================================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker and try again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Ask for deployment action
echo "Select deployment action:"
echo "  1) 🆕 Complete fresh deployment (setup + build + deploy + schema)"
echo "  2) 🏗️  Build and deploy only (requires existing .env)"
echo "  3) 🔄 Update application only (rebuild app container)"
echo "  4) ♻️  Restart all services"
echo "  5) 📋 View logs"
echo "  6) 🛑 Stop all services"
echo "  7) 🧹 Clean up (remove containers and volumes)"
echo ""
read -p "Enter choice [1-7]: " choice

case $choice in
    1)
        echo ""
        echo "=========================================="
        echo "🆕 COMPLETE FRESH DEPLOYMENT"
        echo "=========================================="
        echo ""

        # Step 1: Run setup script
        echo "📝 Step 1/4: Running instance setup..."
        echo ""
        if [ ! -x "docker/scripts/setup-instance.sh" ]; then
            chmod +x docker/scripts/setup-instance.sh
        fi
        ./docker/scripts/setup-instance.sh

        if [ ! -f ".env" ]; then
            echo ""
            echo "❌ Error: Setup script did not create .env file"
            exit 1
        fi

        echo ""
        echo "✅ Step 1/4: Instance setup complete!"
        echo ""

        # Verify critical environment variables in .env
        echo "🔍 Verifying .env file..."
        for var in POSTGRES_PASSWORD JWT_SECRET SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
            if ! grep -q "^${var}=" .env; then
                echo "❌ Error: ${var} not found in .env file"
                exit 1
            fi
        done
        echo "✅ Environment variables verified"
        echo ""

        # Verify critical configuration files exist as files (not directories)
        echo "🔍 Verifying configuration files..."
        if [ ! -f "volumes/logs/vector.yml" ]; then
            echo "❌ Error: volumes/logs/vector.yml is not a file"
            ls -ld volumes/logs/vector.yml 2>/dev/null || echo "File does not exist"
            exit 1
        fi
        if [ ! -f "volumes/api/kong.yml" ]; then
            echo "❌ Error: volumes/api/kong.yml is not a file"
            ls -ld volumes/api/kong.yml 2>/dev/null || echo "File does not exist"
            exit 1
        fi
        echo "✅ Configuration files verified"
        echo ""

        # Step 2: Build Docker images
        echo "🏗️  Step 2/4: Building Docker images..."
        echo ""
        # Note: --no-cache ensures fresh build, doesn't affect .env reading
        # Docker Compose will automatically read .env file when running any command
        docker compose build --no-cache
        echo ""
        echo "✅ Step 2/4: Build complete!"
        echo ""

        # Verify configuration files still exist as files after build
        echo "🔍 Re-verifying configuration files after build..."
        if [ -d "volumes/logs/vector.yml" ] || [ -d "volumes/api/kong.yml" ]; then
            echo "❌ Error: Configuration files were converted to directories during build!"
            echo "   This shouldn't happen. Check Docker Compose volume mounts."
            ls -ld volumes/logs/vector.yml volumes/api/kong.yml
            exit 1
        fi
        echo "✅ Configuration files still valid after build"
        echo ""

        # Step 3: Start all services
        echo "🚀 Step 3/4: Starting all services..."
        echo ""
        docker compose up -d

        # Wait for database to be healthy
        echo ""
        echo "⏳ Waiting for database to be ready..."
        max_attempts=30
        attempt=0
        while [ $attempt -lt $max_attempts ]; do
            if docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
                echo "✅ Database is ready!"
                break
            fi
            attempt=$((attempt + 1))
            echo "   Attempt $attempt/$max_attempts..."
            sleep 2
        done

        if [ $attempt -eq $max_attempts ]; then
            echo "❌ Error: Database failed to start"
            echo "Check logs with: docker compose logs db"
            exit 1
        fi

        echo ""
        echo "✅ Step 3/4: All services started!"
        echo ""

        # Step 4: Apply database schema
        echo "📊 Step 4/4: Applying database schema..."
        echo ""
        if [ ! -x "docker/scripts/apply-schema.sh" ]; then
            chmod +x docker/scripts/apply-schema.sh
        fi
        echo "y" | ./docker/scripts/apply-schema.sh

        echo ""
        echo "✅ Step 4/4: Schema applied successfully!"
        echo ""

        # Display access information
        echo "=========================================="
        echo "🎉 DEPLOYMENT COMPLETE!"
        echo "=========================================="
        echo ""

        # Read URLs from .env
        APP_PORT=$(grep "^APP_PORT=" .env | cut -d'=' -f2)
        NEXT_PUBLIC_SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env | cut -d'=' -f2)
        SITE_URL=$(grep "^SITE_URL=" .env | cut -d'=' -f2)
        STUDIO_PORT=$(grep "^STUDIO_PORT=" .env | cut -d'=' -f2)
        SETUP_PASSWORD=$(grep "^SETUP_PASSWORD=" .env | cut -d'=' -f2)
        ADMIN_EMAIL=$(grep "^ADMIN_EMAIL=" .env | cut -d'=' -f2)
        ADMIN_PASSWORD=$(grep "^ADMIN_PASSWORD=" .env | cut -d'=' -f2)

        echo "📋 Access Information:"
        echo ""
        if [[ "$SITE_URL" == http://localhost* ]]; then
            echo "  🌐 Application:"
            echo "     ${SITE_URL:-http://localhost:${APP_PORT:-3025}}"
            echo ""
            echo "  🔧 Supabase API:"
            echo "     ${NEXT_PUBLIC_SUPABASE_URL:-http://localhost:8000}"
            echo ""
            echo "  📊 Supabase Studio:"
            echo "     http://localhost:${STUDIO_PORT:-3000}"
        else
            # Extract subdomain and base domain for Studio URL
            DOMAIN="${SITE_URL#https://}"
            if [[ "$DOMAIN" =~ ^([^.]+)\.(.+)$ ]]; then
                SUBDOMAIN="${BASH_REMATCH[1]}"
                BASE_DOMAIN="${BASH_REMATCH[2]}"
                STUDIO_URL="https://${SUBDOMAIN}3.${BASE_DOMAIN}"
            else
                STUDIO_URL="https://supabase.${DOMAIN}"
            fi

            echo "  🌐 Application:"
            echo "     ${SITE_URL}"
            echo ""
            echo "  🔧 Supabase API:"
            echo "     ${NEXT_PUBLIC_SUPABASE_URL}"
            echo ""
            echo "  📊 Supabase Studio (with authentication):"
            echo "     ${STUDIO_URL}"
        fi

        echo ""
        echo "=========================================="
        echo "📝 Next Steps:"
        echo "=========================================="
        echo ""
        echo "1️⃣  Access the setup page:"
        echo "   ${SITE_URL}/setup"
        echo "   Password: ${SETUP_PASSWORD}"
        echo ""
        echo "2️⃣  This will create your admin account with:"
        echo "   Email: ${ADMIN_EMAIL}"
        echo "   Password: ${ADMIN_PASSWORD}"
        echo ""
        echo "3️⃣  Login to the application:"
        echo "   ${SITE_URL}/login"
        echo ""
        echo "📄 For more details, see: INSTANCE_INFO.txt"
        echo ""
        echo "🔍 Check status: docker compose ps"
        echo "📋 View logs:    docker compose logs -f"
        echo ""
        ;;

    2)
        echo ""
        echo "=========================================="
        echo "🏗️  BUILD AND DEPLOY ONLY"
        echo "=========================================="
        echo ""

        # Check if .env file exists
        if [ ! -f ".env" ]; then
            echo "❌ Error: .env file not found"
            echo ""
            echo "Run option 1 (Complete fresh deployment) first, or:"
            echo "  ./docker/scripts/setup-instance.sh"
            exit 1
        fi

        echo "🏗️  Building Docker images..."
        docker compose down
        docker compose build --no-cache

        echo ""
        echo "🚀 Starting all services..."
        docker compose up -d

        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "Services are starting up. Check status with:"
        echo "  docker compose ps"
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
            # Extract subdomain and base domain for Studio URL
            DOMAIN="${SITE_URL#https://}"
            if [[ "$DOMAIN" =~ ^([^.]+)\.(.+)$ ]]; then
                SUBDOMAIN="${BASH_REMATCH[1]}"
                BASE_DOMAIN="${BASH_REMATCH[2]}"
                STUDIO_URL="https://${SUBDOMAIN}3.${BASE_DOMAIN}"
            else
                STUDIO_URL="https://supabase.${DOMAIN}"
            fi

            echo "  - App: ${SITE_URL}"
            echo "  - Supabase API: ${NEXT_PUBLIC_SUPABASE_URL}"
            echo "  - Supabase Studio: ${STUDIO_URL}"
        fi
        ;;

    3)
        echo ""
        echo "🔄 Updating application..."
        docker compose build app
        docker compose up -d app
        echo ""
        echo "✅ Application updated!"
        ;;

    4)
        echo ""
        echo "♻️  Restarting all services..."
        docker compose restart
        echo ""
        echo "✅ Services restarted!"
        ;;

    5)
        echo ""
        echo "📋 Viewing logs (Ctrl+C to exit)..."
        docker compose logs -f
        ;;

    6)
        echo ""
        echo "🛑 Stopping all services..."
        docker compose down
        echo ""
        echo "✅ All services stopped!"
        ;;

    7)
        echo ""
        read -p "⚠️  This will remove all containers and volumes. Continue? [y/N]: " confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            echo ""
            echo "🧹 Cleaning up..."
            docker compose down -v
            docker system prune -f

            echo ""
            echo "🗑️  Removing configuration files..."
            rm -f .env INSTANCE_INFO.txt

            echo ""
            echo "📁 Attempting to remove volumes directory..."
            if rm -rf volumes/ 2>/dev/null; then
                echo "✅ Volumes directory removed"
            else
                echo "⚠️  Could not remove volumes/db/data (requires sudo)"
                echo "   Please run: sudo rm -rf volumes/"
            fi

            echo ""
            echo "✅ Cleanup complete!"
            echo ""
            echo "To start fresh, run option 1 (Complete fresh deployment)"
        else
            echo "Cancelled"
        fi
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
