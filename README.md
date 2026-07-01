# Smart Campus Parking Management System

The **Smart Campus Parking Management System** is an enterprise-grade full-stack solution designed for universities to orchestrate student/faculty parking spot reservations, handle physical guard gate validations, and track real-time parking metrics under custom zones.

This workspace provides **two complete setups**:
1. **Live Preview System (React + Express Full-Stack Node Server)**: Immediately interactive and running in the AI Studio container sandbox on Port 3000. It utilizes a persistent JSON database storage system to simulate all core role flows (Student, Officer, Admin) without database cold-starts.
2. **Production Codebase (React + Java Spring Boot 3 + MySQL + Docker)**: A complete, structured Maven Spring Boot application ready to be exported and containerized on university servers.

---

## Technical Specifications

### 💻 Frontend (Vite + React + TypeScript + Tailwind CSS)
* **Visual rhythm**: High-contrast, clean corporate color scheme utilizing Inter (Primary Typography) paired with Space Grotesk (headings) and JetBrains Mono (gate logs).
* **Self-Service Booking**: Dynamic slot booking forms, vehicle registries, and interactive grid visualizers representing campus lots.
* **Security Guard Portal**: Scanning simulator allowing gate officers to search plates, validate entry/exit on active bookings, and log system anomalies.
* **Admin Hub**: Beautifully aligned SVG statistical charts representing zone capacities, live occupancy rates, and slot types distribution.

### ☕ Backend (Java 21 + Spring Boot 3 + Hibernate JPA + Security)
* **Layered Architecture**: SOLID design splitting logic across Controllers, Mappers, DTOs, Services, and Repositories.
* **Database Engine**: Spring Data JPA targeting relational MySQL schemas with auto-generation ddl structures.
* **Business Rules Engine**: Checks overlapping timelines to prevent double bookings, filters out maintenance-locked spots, and verifies vehicle registrations.
* **Secured REST**: Configured with JWT Token decoders and BCrypt password encryption protecting university endpoints.
* **OpenAPI Documentation**: Pre-configured Swagger UI available at `/swagger-ui.html`.

---

## Workspace Folder Layout

```text
├── .env.example               # Environment template variables
├── server.ts                  # High-performance full-stack Express live mock server
├── package.json               # Node workspace scripts & packages
├── Dockerfile                 # React frontend container compilation
├── docker-compose.yml         # Shared services orchestrator (MySQL + Spring + React)
│
├── src/                       # Frontend Source
│     ├── App.tsx              # Application core state & alerts
│     ├── types.ts             # Global TypeScript interface structures
│     ├── index.css            # Custom theme definitions & fonts
│     └── components/          # Modular component views
│           ├── Sidebar.tsx
│           ├── AdminDashboard.tsx
│           ├── AgentDashboard.tsx
│           ├── UserDashboard.tsx
│           └── AdminModules.tsx
│
├── backend-spring-boot/       # Production Java Spring Boot Source
│     ├── pom.xml              # Maven dependencies compiler (JPA, Doc, JWT)
│     ├── Dockerfile           # Backend container compiler
│     └── src/main/
│           ├── resources/
│           │     └── application.yml
│           └── java/com/campus/parking/
│                 ├── config/        # Swagger OpenAPI configuration
│                 ├── controller/    # REST endpoints exposing JSON maps
│                 ├── entity/        # JPA Entities (User, Vehicle, Slot)
│                 ├── repository/    # JpaRepositories
│                 ├── security/      # Spring Security JWT Filters
│                 ├── service/       # Business implementations & interfaces
│                 └── ParkingApplication.java
│
└── scripts/                   # System Administrator Unix Shell Utilities
      ├── build.sh             # Compiles Java & container structures
      ├── run.sh               # Boots daemon docker-compose services
      ├── stop.sh              # Spins down containers safely
      ├── status.sh            # Summarizes port mappings & container states
      ├── health-check.sh      # Tests curl response codes and networking
      └── backup-db.sh         # Generates automated MySQL dump backups
```

---

## Setup & Running Guide

### 1. Active Live Preview (Express Sandbox)
The Express sandbox is pre-booted and running inside the container workspace. Any local edits made on files will hot-compile.
* **Local Run**: `npm run dev` (starts the unified server on port 3000)
* **Build App**: `npm run build` (packages Vite code and bundles server into CJS)

### 2. Production Docker-Compose Deployment
Deploy the full React + Spring Boot + MySQL cluster with a single command:

1. Mark scripts as executable:
   ```bash
   chmod +x scripts/*.sh
   ```
2. Build the project artifacts and images:
   ```bash
   ./scripts/build.sh
   ```
3. Boot the environment:
   ```bash
   ./scripts/run.sh
   ```
4. Perform diagnostic tests:
   ```bash
   ./scripts/health-check.sh
   ```

---

## Pre-Seeded Accounts for Testing

| Email | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| **admin@campus.edu** | `admin123` | **ADMIN** | Full management, slot registrations, statistics. |
| **agent1@campus.edu** | `agent123` | **AGENT** | Gate control validations, anomaly logger. |
| **user1@campus.edu** | `user123` | **USER** | Personal reservations, vehicle registrations. |

---

## OpenAPI Swagger Details
Once the Java backend service is launched (default port `8082`), you can view complete API specifications and test endpoints directly:
* **Interactive UI**: `http://localhost:8082/swagger-ui.html`
* **JSON Schema Document**: `http://localhost:8082/v3/api-docs`
