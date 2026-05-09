# Project Assumptions

1. Self-registration is limited to `student` and `staff`.
2. `admin` account is seeded by the system for initial setup.
3. Equipment return actions are processed by `staff` or `admin`.
4. Borrow requests with overlapping dates are blocked if requested quantity exceeds available total.
5. SQLite is acceptable for assignment-level persistence and local demos.
6. Internal service-to-service endpoints are protected using `x-service-key`.
