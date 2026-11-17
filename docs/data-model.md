# Data model

BookFlow stores everything in PostgreSQL through Prisma. The schema lives in
[`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma) and every change is a
versioned migration in [`apps/api/prisma/migrations`](../apps/api/prisma/migrations).

```mermaid
erDiagram
    Business ||--o{ User : "has"
    Business ||--o{ Staff : "employs"
    Business ||--o{ Service : "offers"
    Business ||--o{ Client : "serves"
    Business ||--o{ Appointment : "schedules"
    User ||--o{ RefreshToken : "owns"
    User |o--o| Staff : "is linked to (STAFF role)"
    Staff ||--o{ WorkingHours : "works"
    Staff }o--o{ Service : "performs"
    Staff ||--o{ Appointment : "attends"
    Service ||--o{ Appointment : "is booked as"
    Client ||--o{ Appointment : "books"

    Business {
        string id PK
        string slug UK "used in /book/:slug"
        string name
        string timezone "America/Argentina/Buenos_Aires"
        string currency "ARS"
    }
    User {
        string id PK
        string email UK
        string passwordHash "bcrypt"
        enum role "ADMIN | STAFF"
        string staffId FK "nullable, unique"
    }
    RefreshToken {
        string id PK
        string tokenHash "SHA-256 of the secret"
        datetime expiresAt
        datetime revokedAt "nullable"
    }
    Staff {
        string id PK
        string name
        string title
        string color
        boolean active
    }
    WorkingHours {
        string id PK
        int weekday "0 = Sunday … 6 = Saturday"
        int startMinute "minutes from local midnight"
        int endMinute
    }
    Service {
        string id PK
        string name
        int durationMinutes
        int price "whole ARS"
        boolean active
    }
    Client {
        string id PK
        string name
        string phone "unique per business"
        string email
    }
    Appointment {
        string id PK
        string code UK "BF-XXXXXX"
        timestamptz startsAt
        timestamptz endsAt
        enum status "CONFIRMED | COMPLETED | CANCELLED | NO_SHOW"
        int price "snapshot at booking time"
    }
```

## Integrity rules enforced by the database

| Rule                                                          | How                                                                                                                                     |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| A staff member can't have two overlapping active appointments | `EXCLUDE USING gist ("staffId" WITH =, tstzrange("startsAt","endsAt",'[)') WITH &&) WHERE (status <> 'CANCELLED')` (needs `btree_gist`) |
| An appointment must end after it starts                       | `CHECK ("endsAt" > "startsAt")`                                                                                                         |
| One client per phone number per business                      | `UNIQUE (businessId, phone)`                                                                                                            |
| Confirmation codes are unique                                 | `UNIQUE (code)`                                                                                                                         |
| History is never orphaned                                     | `ON DELETE RESTRICT` from appointments to staff, service and client; the API deactivates instead of deleting                            |

Time ranges are half-open (`[start, end)`), so back-to-back appointments (10:00–10:30 and
10:30–11:00) are allowed.
