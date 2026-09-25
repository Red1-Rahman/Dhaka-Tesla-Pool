# Codebase Tree

```
dhaka-tesla-pool/
├── docker-compose.yml
├── .env.example
├── README.md
├── docs/
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-contracts.md
│   ├── specs.md
│   ├── tech-stack.md
│   ├── conventions.md
│   └── codebase.md
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── dto/
│   │   │       ├── signup.dto.ts
│   │   │       └── signin.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   │       └── update-user.dto.ts
│   │   │
│   │   ├── vehicles/
│   │   │   ├── vehicles.module.ts
│   │   │   ├── vehicles.controller.ts
│   │   │   ├── vehicles.service.ts
│   │   │   └── dto/
│   │   │       └── set-online.dto.ts
│   │   │
│   │   ├── rides/
│   │   │   ├── rides.module.ts
│   │   │   ├── rides.controller.ts
│   │   │   ├── rides.service.ts
│   │   │   └── dto/
│   │   │       ├── create-ride.dto.ts
│   │   │       └── cancel-ride.dto.ts
│   │   │
│   │   ├── pools/
│   │   │   ├── pools.module.ts
│   │   │   ├── pools.controller.ts
│   │   │   ├── pools.service.ts
│   │   │   └── dto/
│   │   │       └── accept-ride.dto.ts
│   │   │
│   │   ├── fare/
│   │   │   ├── fare.module.ts
│   │   │   ├── fare.service.ts
│   │   │   └── fare.constants.ts
│   │   │
│   │   ├── geo/
│   │   │   ├── geo.module.ts
│   │   │   ├── geo.service.ts
│   │   │   └── zones.data.ts
│   │   │
│   │   ├── payments/
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.service.ts
│   │   │   └── dto/
│   │   │       └── charge.dto.ts
│   │   │
│   │   ├── common/
│   │   │   ├── status-machine.ts
│   │   │   ├── money.ts
│   │   │   ├── fare-split.ts
│   │   │   ├── prisma.service.ts
│   │   │   └── filters/
│   │   │       └── http-exception.filter.ts
│   │   │
│   │   └── config/
│   │       └── env.validation.ts
│   │
│   └── test/
│       ├── rides.service.spec.ts
│       ├── pools.service.spec.ts
│       ├── fare.service.spec.ts
│       ├── fare-split.spec.ts
│       ├── pools.e2e-spec.ts
│       └── auth.e2e-spec.ts
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── (auth)/
    │   │   ├── signin/page.tsx
    │   │   └── signup/page.tsx
    │   ├── (passenger)/
    │   │   ├── request/page.tsx
    │   │   ├── rides/page.tsx
    │   │   └── rides/[id]/page.tsx
    │   └── (driver)/
    │       ├── dashboard/page.tsx
    │       ├── pools/[id]/page.tsx
    │       └── vehicle/page.tsx
    ├── components/
    │   ├── RideRequestForm.tsx
    │   ├── RideStatusBadge.tsx
    │   ├── PoolPassengerList.tsx
    │   └── FareBreakdown.tsx
    ├── lib/
    │   ├── api-client.ts
    │   └── auth-context.tsx
    └── types/
        └── api.ts
```
