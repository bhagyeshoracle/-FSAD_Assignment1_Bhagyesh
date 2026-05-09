# Demonstration Video Script (5-8 minutes)

## 1. Introduction (30 sec)

- Project title: Campus Equipment Lending Portal
- Stack: React + Node.js microservices + SQLite
- Goal: digitize request/approval/return workflow with role-based access

## 2. Architecture Overview (45 sec)

- Show API Gateway and three services
- Mention persistent database and conflict prevention
- Mention role model: student/staff/admin

## 3. Student Flow (2 min)

1. Login as `student@school.edu`
2. Open Equipment Dashboard
3. Use search/filter
4. Create a borrow request with dates and quantity
5. Open "My Requests" to show status `PENDING`

## 4. Staff Flow (2 min)

1. Logout and login as `staff@school.edu`
2. Open Approvals page
3. Approve pending request
4. Show student request now `APPROVED`
5. Mark request as `RETURNED`

## 5. Admin Flow (1.5 min)

1. Login as `admin@school.edu`
2. Open Manage Equipment
3. Add new equipment
4. Edit quantity/condition
5. Delete equipment with no active booking

## 6. Conflict Prevention Demo (45 sec)

- Create overlapping requests that exceed available quantity
- Show system validation message

## 7. Closing (30 sec)

- Summarize implemented features
- Mention AI-assisted development and reflection document
- Mention deliverables: GitHub repo + docs + video link
