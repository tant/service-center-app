<!--
Sync Impact Report:
- Version change: None -> 1.0.0
- Added sections: All initial sections and principles.
- Removed sections: None
- Templates requiring updates:
  - ✅ /home/khanh/service-center/.specify/templates/plan-template.md
- Follow-up TODOs: None
-->
# Service Center Constitution

## Core Principles

### I. Modern Web Stack
This project is built on a modern, robust technology stack. All new development must adhere to this stack to ensure consistency, performance, and maintainability.
- **Frontend**: Next.js with TypeScript
- **Styling**: Tailwind CSS v4
- **Backend & Database**: Supabase (using local development environment for consistency)

### II. Service Center Domain
The primary purpose of this application is to serve as a comprehensive solution for service centers, managing warranties, repairs, and inventory for electronic and IT products. All features must be aligned with improving this core business process.

### III. Reproducible Development
Every developer must use the local Supabase development environment to ensure a consistent and isolated workspace. This minimizes environment-related bugs and simplifies onboarding. The setup and migration process must be clearly documented.

### IV. Code Quality and Consistency
Code must be clean, well-documented, and strongly typed using TypeScript. We will enforce a component-based architecture in the frontend and follow best practices for backend service implementation.

### V. Comprehensive Testing
To ensure reliability, a Test-Driven Development (TDD) approach is encouraged. All critical business logic and components must be covered by unit and integration tests before they are considered complete.

## Technology Stack
The following technologies are approved for this project. Any deviation requires a formal amendment to this constitution.
- **Framework**: Next.js
- **Language**: TypeScript
- **Backend**: Supabase
- **Styling**: Tailwind CSS v4

## Development Workflow
The development process will follow a structured workflow involving specifications, planning, and task execution. All work should be traceable to a specification and a plan.

## Governance
This constitution is the single source of truth for project standards. Any proposed changes must be reviewed and approved by the project maintainers. All pull requests will be checked for compliance with these principles.

**Version**: 1.0.0 | **Ratified**: 2025-09-26 | **Last Amended**: 2025-09-26