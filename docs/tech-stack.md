# Tech Stack

| Layer | Choice |
|---|---|
| Backend framework | NestJS | 
| Frontend | Next.js (App Router) |
| Database | PostgreSQL |
| Validation | class-validator + class-transformer (via NestJS DTOs) |
| Auth | JWT (access token only, no refresh flow for MVP) |
| Concurrency control | Postgres row lock (`SELECT ... FOR UPDATE`) inside a transaction |
| Containerization | Docker Compose (api, web, postgres) |
| Hosting | Render or Railway free tier for API and DB, Vercel free tier for Next.js |
