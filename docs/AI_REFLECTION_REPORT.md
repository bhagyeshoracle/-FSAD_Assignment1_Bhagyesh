# AI Reflection Report (1-2 pages)

## 1. Which AI tools were used and how?

I used an AI coding assistant (Codex/GPT-based) throughout development. The assistant was used as a pair-programming tool, not as a blind code generator. I used it to:

- design a suitable assignment architecture
- scaffold backend microservices and frontend routes
- generate repetitive CRUD and form-handling logic
- draft API documentation and architecture notes
- troubleshoot setup issues quickly

## 2. Example prompts used

- "Create a full-stack React + Node microservices project for equipment lending."
- "Add role-based authentication with JWT for student/staff/admin."
- "Implement overlap conflict validation for booking requests."
- "Generate API documentation and architecture diagrams in markdown."

## 3. Which parts were AI-generated vs manually coded?

AI-generated parts:

- initial structure for backend services and frontend pages
- JWT middleware and API wiring
- repetitive UI patterns and table views
- draft docs and endpoint descriptions

Manually completed/refined parts:

- choosing final problem scope and constraints
- reviewing business rules (approval flow, return flow, conflict logic)
- validating endpoint behavior and UI navigation
- improving assignment-fit documentation and demo plan

## 4. Did AI help or hinder understanding?

AI significantly improved development speed and reduced setup friction. It helped me move from idea to a working prototype quickly.  
However, understanding was improved only when I reviewed generated code in detail. Without active review, some generated code can look correct but hide logic assumptions.

So AI helped understanding when used interactively, with verification and edits, rather than copy-paste use.

## 5. What issues occurred while integrating AI output?

Main issues:

1. Environment-specific execution issue (`npm` blocked in PowerShell).
2. Version mismatch risk with React Router APIs.
3. Need to ensure consistent naming between frontend fields and backend payloads.
4. Need to verify business logic edge cases (overlap and quantity checks).

These issues were solved through iterative testing and small adjustments.

## 6. What was learned from debugging AI-generated code?

Key learnings:

- generated code must always be treated as a draft
- architecture decisions matter more than code volume
- API contracts should be stabilized early
- role-based systems require checks in both frontend and backend
- debugging generated code strengthened my understanding of Express middleware, React state flow, and service integration

## 7. Overall conclusion

AI accelerated this assignment and improved productivity, especially for scaffolding and repetitive coding.  
The best results came from combining AI speed with manual validation, testing, and architecture-level ownership.
