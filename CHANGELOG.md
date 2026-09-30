# Changelog

All notable changes to Dhaka Tesla Pool are documented in this file.

## [1.1.0] - 2026-09-30

### Added

- Added driver vehicle online/offline status management.
- Added the driver "Online — accepting rides" workflow.
- Added real backend integration for the driver dashboard.
- Added ride-request acceptance for drivers.
- Added active pool retrieval for drivers.
- Added the complete driver pool lifecycle:
  - Accept ride
  - Matched
  - Driver arrived
  - Start ride
  - Complete ride
- Added frontend API types and client methods for driver vehicle and pool operations.
- Added persistent active-pool loading when returning to the driver dashboard.

### Fixed

- Corrected pool seat reporting to calculate occupied seats from requested seat counts.
- Fixed frontend authentication to use the centralized `UserResponse` API type.
- Fixed frontend Docker builds so `NEXT_PUBLIC_API_URL` is available during the Next.js build.
- Fixed backend Docker runtime/database startup configuration.
- Fixed a CI workflow filename typo.

### Documentation

- Updated the README with the current live application URL.

### Tests

- Updated pool service tests to reflect seat-based capacity reporting.
