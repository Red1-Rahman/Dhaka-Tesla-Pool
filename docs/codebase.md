# Codebase Tree

```
dhaka-tesla-pool/
│   .env.example
│   .gitignore
│   docker-compose.yml
│   README.md
│
├───backend
│   │   .dockerignore
│   │   Dockerfile
│   │   nest-cli.json
│   │   package-lock.json
│   │   package.json
│   │   tsconfig.build.json
│   │   tsconfig.json
│   │
│   ├───prisma
│   │   │   schema.prisma
│   │   │   seed.ts
│   │   │
│   │   └───migrations
│   │       │   migration_lock.toml
│   │       │
│   │       └───20260926120000_init
│   │               migration.sql
│   │
│   └───src
│       │   app.module.ts
│       │   main.ts
│       │
│       ├───auth
│       │   │   auth.controller.ts
│       │   │   auth.module.ts
│       │   │   auth.service.ts
│       │   │   jwt.strategy.ts
│       │   │   roles.guard.ts
│       │   │
│       │   └───dto
│       │           signin.dto.ts
│       │           signup.dto.ts
│       │
│       ├───common
│       │   │   money.ts
│       │   │   prisma.module.ts
│       │   │   prisma.service.ts
│       │   │   status-machine.ts
│       │   │
│       │   └───filters
│       │           http-exception.filter.ts
│       │
│       ├───config
│       │       env.validation.ts
│       │
│       ├───fare
│       │       fare.constants.ts
│       │       fare.module.ts
│       │       fare.service.ts
│       │
│       ├───geo
│       │       geo.module.ts
│       │       geo.service.ts
│       │       zones.data.ts
│       │
│       ├───health
│       │       health.controller.ts
│       │       health.module.ts
│       │
│       ├───payments
│       │   │   payments.module.ts
│       │   │   payments.service.ts
│       │   │
│       │   └───dto
│       │           charge.dto.ts
│       │
│       ├───pools
│       │   │   pools.controller.ts
│       │   │   pools.module.ts
│       │   │   pools.service.ts
│       │   │
│       │   └───dto
│       │           accept-ride.dto.ts
│       │
│       ├───rides
│       │   │   rides.controller.ts
│       │   │   rides.module.ts
│       │   │   rides.service.ts
│       │   │
│       │   └───dto
│       │           cancel-ride.dto.ts
│       │           create-ride.dto.ts
│       │
│       ├───users
│       │   │   users.controller.ts
│       │   │   users.module.ts
│       │   │   users.service.ts
│       │   │
│       │   └───dto
│       │           update-user.dto.ts
│       │
│       └───vehicles
│           │   vehicles.controller.ts
│           │   vehicles.module.ts
│           │   vehicles.service.ts
│           │
│           └───dto
│                   set-online.dto.ts
│
├───docs
│       api-contracts.md
│       architecture.md
│       codebase.md
│       conventions.md
│       database-schema.md
│       specs.md
│       tech-stack.md
│
└───frontend
    │   Dockerfile
    │   next.config.js
    │   package-lock.json
    │   package.json
    │   pnpm-lock.yaml
    │   postcss.config.mjs
    │   tsconfig.json
    │
    ├───app
    │   │   globals.css
    │   │   layout.tsx
    │   │   page.tsx
    │   │
    │   ├───(auth)
    │   │   ├───signin
    │   │   │       page.tsx
    │   │   │
    │   │   └───signup
    │   │           page.tsx
    │   │
    │   ├───(driver)
    │   │   ├───dashboard
    │   │   │       page.tsx
    │   │   │
    │   │   ├───pools
    │   │   │   └───[id]
    │   │   │           page.tsx
    │   │   │
    │   │   └───vehicle
    │   │           page.tsx
    │   │
    │   └───(passenger)
    │       ├───request
    │       │       page.tsx
    │       │
    │       ├───rides
    │       │   │   page.tsx
    │       │   │
    │       │   └───[id]
    │       │           page.tsx
    │       │
    │       └───wallet
    │               page.tsx
    │
    ├───components
    │   │   FareBreakdown.tsx
    │   │   PoolPassengerList.tsx
    │   │   RideRequestForm.tsx
    │   │   RideStatusBadge.tsx
    │   │
    │   └───ui
    │           paisa-amount.tsx
    │           paisa-icon.tsx
    │
    ├───lib
    │       api-client.ts
    │       auth-context.tsx
    │       format.ts
    │       mock-data.ts
    │
    ├───public
    │   └───icons
    │           shapla-E8FF59.svg
    │
    └───types
            api.ts
```
