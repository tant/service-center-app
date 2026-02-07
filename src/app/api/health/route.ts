/**
 * Health Check API Endpoint
 * Story 1.20: Production Deployment and Monitoring Setup
 *
 * Returns system health status for monitoring and load balancers
 * Checks: database connection, Supabase services, application health
 */

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

interface HealthStatus {
  status: "healthy" | "degraded" | "down";
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: "ok" | "error";
      message: string;
      responseTime?: number;
    };
    supabase: {
      status: "ok" | "error";
      message: string;
    };
    application: {
      status: "ok" | "error";
      message: string;
      uptime?: number;
    };
  };
  environment: string;
  responseTime?: number;
}

/**
 * GET /api/health
 * Returns comprehensive health check information
 */
export async function GET() {
  const startTime = Date.now();

  const healthStatus: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    checks: {
      database: {
        status: "ok",
        message: "Database connection healthy",
      },
      supabase: {
        status: "ok",
        message: "Supabase services available",
      },
      application: {
        status: "ok",
        message: "Application running",
        uptime: process.uptime(),
      },
    },
    environment: process.env.NODE_ENV || "development",
  };

  // Check 1: Database Connection
  try {
    const supabase = await createClient();
    const dbStartTime = Date.now();

    // Simple query to test database connection
    const { error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const dbResponseTime = Date.now() - dbStartTime;

    if (error) {
      healthStatus.checks.database.status = "error";
      healthStatus.checks.database.message = `Database error: ${error.message}`;
      healthStatus.status = "degraded";
    } else {
      healthStatus.checks.database.responseTime = dbResponseTime;
      healthStatus.checks.database.message = `Database connection healthy (${dbResponseTime}ms)`;
    }
  } catch (error) {
    healthStatus.checks.database.status = "error";
    healthStatus.checks.database.message = `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`;
    healthStatus.status = "down";
  }

  // Check 2: Supabase Services
  try {
    const supabase = await createClient();

    // Test auth service by checking if client is available
    const { error } = await supabase.auth.getUser();

    if (error && error.message !== "Auth session missing!") {
      // Auth session missing is OK (not logged in), but other errors are not
      healthStatus.checks.supabase.status = "error";
      healthStatus.checks.supabase.message = `Supabase auth error: ${error.message}`;
      if (healthStatus.status === "healthy") {
        healthStatus.status = "degraded";
      }
    } else {
      healthStatus.checks.supabase.message = "Supabase services available";
    }
  } catch (error) {
    healthStatus.checks.supabase.status = "error";
    healthStatus.checks.supabase.message = `Supabase services failed: ${error instanceof Error ? error.message : "Unknown error"}`;
    healthStatus.status = "down";
  }

  // Check 3: Application Health
  try {
    // Check if essential environment variables are set
    const requiredEnvVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );

    if (missingEnvVars.length > 0) {
      healthStatus.checks.application.status = "error";
      healthStatus.checks.application.message = `Missing environment variables: ${missingEnvVars.join(", ")}`;
      healthStatus.status = "down";
    } else {
      healthStatus.checks.application.message = `Application healthy (uptime: ${Math.floor(process.uptime())}s)`;
    }
  } catch (error) {
    healthStatus.checks.application.status = "error";
    healthStatus.checks.application.message = `Application check failed: ${error instanceof Error ? error.message : "Unknown error"}`;
    healthStatus.status = "down";
  }

  // Determine HTTP status code based on health
  let statusCode = 200;
  if (healthStatus.status === "degraded") {
    statusCode = 503; // Service Unavailable (degraded)
  } else if (healthStatus.status === "down") {
    statusCode = 503; // Service Unavailable (down)
  }

  const totalResponseTime = Date.now() - startTime;

  // Add overall response time
  healthStatus.responseTime = totalResponseTime;

  return NextResponse.json(healthStatus, { status: statusCode });
}

/**
 * HEAD /api/health
 * Lightweight health check for load balancers
 * Returns 200 if healthy, 503 if degraded/down
 */
export async function HEAD() {
  try {
    const supabase = await createClient();

    // Quick database connectivity check
    const { error } = await supabase
      .from("profiles")
      .select("id", { head: true, count: "exact" })
      .limit(1);

    if (error) {
      return new NextResponse(null, { status: 503 });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
