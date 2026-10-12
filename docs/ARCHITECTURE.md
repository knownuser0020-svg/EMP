# Architecture

```mermaid
flowchart LR
  A[Admin Electron + React] -->|HTTPS + JWT| API[Spring Boot API]
  E[Employee Electron + React] -->|HTTPS + JWT| API
  H[Opt-in Electron input counters] --> Q[Bounded JSON retry queue]
  Q -->|Five-minute batches| API
  API -->|HikariCP / short transactions| DB[(PostgreSQL)]
  API -->|Presigned optional upload| S3[Private asset storage]
```

```mermaid
erDiagram
  EMPLOYEES ||--o{ ATTENDANCE : records
  EMPLOYEES ||--o{ LEAVE_REQUESTS : requests
  EMPLOYEES ||--o{ ONBOARDING_TASKS : completes
  EMPLOYEES ||--o{ ACTIVITY_LOGS : submits
  EMPLOYEES { uuid id PK
    string email UK
    string role
    long auth_version
  }
  ATTENDANCE { uuid employee_id FK
    date log_date
    instant clock_in
    instant clock_out
  }
  LEAVE_REQUESTS { uuid employee_id FK
    date start_date
    date end_date
    long version
  }
  ACTIVITY_LOGS { uuid employee_id FK
    uuid batch_id
    date log_date
    string screenshot_url
  }
```

Frontend caches separate live authentication from persisted demo data. Access tokens never enter localStorage. API filter chains enforce URL roles; task controllers enforce record ownership. Logout increments an account token version. Stateless HTTP does not imply that JWT revocation has no persistent metadata.

The database uses Flyway migrations and Hibernate validation. Attendance serializes only operations for the same employee, with a database unique partial index as a second safeguard. Leave reviews use optimistic versioning. Telemetry transactions use per-user locks plus a unique batch key for safe retry. Onboarding task loading is batched for each candidate page to avoid a per-candidate query pattern. Application image blobs are absent from every table.

The desktop UI and main process have distinct privilege boundaries. Main-process hooks retain counters only; the preload exposes explicit commands, not raw filesystem, shell, or arbitrary IPC access. Production URL navigation and popups are blocked. Operating-system permissions and explicit user consent remain prerequisites for activity sharing.
