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
│   │   │   seed.ts                         # Seeds demo database
│   │   │
│   │   └───migrations
│   │       │   migration_lock.toml
│   │       │
│   │       └───20260926120000_init
│   │               migration.sql
│   │
│   └───src
│       │   app.module.ts                   # Configures application modules
│       │   main.ts                         # Starts NestJS application
│       │
│       ├───auth
│       │   │   auth.controller.ts          # Handles authentication endpoints
│       │   │   auth.module.ts              # Configures authentication module
│       │   │   auth.service.ts             # Implements authentication logic
│       │   │   jwt.strategy.ts             # Validates JWT tokens
│       │   │   roles.guard.ts              # Enforces user roles
│       │   │
│       │   └───dto
│       │           signin.dto.ts            # Validates sign-in requests
│       │           signup.dto.ts            # Validates sign-up requests
│       │
│       ├───common
│       │   │   money.ts                     # Handles monetary values
│       │   │   prisma.module.ts             # Provides Prisma service
│       │   │   prisma.service.ts            # Manages database access
│       │   │   status-machine.ts            # Manages ride status
│       │   │
│       │   └───filters
│       │           http-exception.filter.ts # Formats HTTP errors
│       │
│       ├───config
│       │       env.validation.ts            # Validates environment variables
│       │
│       ├───fare
│       │       fare.constants.ts            # Defines fare constants
│       │       fare.module.ts               # Configures fare module
│       │       fare.service.ts              # Calculates ride fares
│       │
│       ├───geo
│       │       geo.module.ts                # Configures geography module
│       │       geo.service.ts               # Handles geographic calculations
│       │       zones.data.ts                # Defines supported zones
│       │
│       ├───health
│       │       health.controller.ts         # Provides health endpoint
│       │       health.module.ts              # Configures health module
│       │
│       ├───payments
│       │   │   payments.module.ts            # Configures payments module
│       │   │   payments.service.ts           # Processes payment operations
│       │   │
│       │   └───dto
│       │           charge.dto.ts              # Validates charge requests
│       │
│       ├───pools
│       │   │   pools.controller.ts           # Handles pool endpoints
│       │   │   pools.module.ts               # Configures pools module
│       │   │   pools.service.ts              # Manages pool operations
│       │   │
│       │   └───dto
│       │           accept-ride.dto.ts        # Validates ride acceptance
│       │
│       ├───rides
│       │   │   rides.controller.ts           # Handles ride endpoints
│       │   │   rides.module.ts               # Configures rides module
│       │   │   rides.service.ts              # Manages ride operations
│       │   │
│       │   └───dto
│       │           cancel-ride.dto.ts        # Validates cancellation requests
│       │           create-ride.dto.ts        # Validates ride creation
│       │
│       ├───users
│       │   │   users.controller.ts           # Handles user endpoints
│       │   │   users.module.ts               # Configures users module
│       │   │   users.service.ts              # Manages user operations
│       │   │
│       │   └───dto
│       │           update-user.dto.ts        # Validates user updates
│       │
│       └───vehicles
│           │   vehicles.controller.ts       # Handles vehicle endpoints
│           │   vehicles.module.ts           # Configures vehicle module
│           │   vehicles.service.ts          # Manages vehicle operations
│           │
│           └───dto
│                   set-online.dto.ts        # Validates online status
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
    │   │   layout.tsx                      # Defines application layout
    │   │   page.tsx                        # Redirects by auth state and role
    │   │
    │   ├───(auth)
    │   │   ├───signin
    │   │   │       page.tsx                # Renders sign-in page
    │   │   │
    │   │   └───signup
    │   │           page.tsx                # Renders sign-up page
    │   │
    │   ├───(driver)
    │   │   ├───dashboard
    │   │   │       page.tsx                # Renders driver dashboard
    │   │   │
    │   │   ├───pools
    │   │   │   └───[id]
    │   │   │           page.tsx             # Renders pool details
    │   │   │
    │   │   └───vehicle
    │   │           page.tsx                # Manages driver vehicle
    │   │
    │   └───(passenger)
    │       ├───request
    │       │       page.tsx                # Renders ride request
    │       │
    │       ├───rides
    │       │   │   page.tsx                # Lists passenger rides
    │       │   │
    │       │   └───[id]
    │       │           page.tsx             # Renders ride details
    │       │
    │       └───wallet
    │               page.tsx                # Renders passenger wallet
    │
    ├───components
    │   │   FareBreakdown.tsx               # Displays fare breakdown
    │   │   PoolPassengerList.tsx            # Displays pool passengers
    │   │   RickshawSilhouette.tsx           # Draws rickshaw with seat occupancy
    │   │   RideRequestForm.tsx               # Handles ride requests
    │   │   RideStatusBadge.tsx               # Displays ride status
    │   │
    │   └───ui
    │           paisa-amount.tsx              # Displays paisa amounts
    │           paisa-icon.tsx                # Displays Shapla currency icon
    │           rickshaw-icon.tsx             # Displays electric rickshaw icon
    │
    ├───lib
    │       api-client.ts                    # Handles backend API requests
    │       auth-context.tsx                 # Manages authentication state
    │       format.ts                        # Formats monetary values
    │       mock-data.ts                     # Provides prototype data
    │
    ├───public
    │   └───icons
    │           shapla-E8FF59.svg
    │
    └───types
            api.ts                           # Defines frontend API types
```
