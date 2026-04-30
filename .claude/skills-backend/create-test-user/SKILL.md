---
name: create-test-user
description: "Crea un usuario de prueba en el proyecto: anónimo, autenticado o admin. Usa seed scripts, endpoints de admin, o inserts directos."
category: "testing"
argument-hint: "[user-type: anonymous | student | admin]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Skill: create-test-user

## Trigger
When the user says "create test user", "crear usuario de prueba", "test user", or similar.

## Workflow

1. Ask what type of user is needed:
   - Anonymous (no auth)
   - Authenticated student
   - Admin / instructor

2. Check the project for existing seed scripts or user creation endpoints:
   - Look in `db/seeds/`, `db/local/`, or test fixtures
   - Check for admin API endpoints
   - Check for database insert scripts

3. Create the user using the appropriate method:
   - Direct database insert
   - API endpoint call
   - Seed script execution

4. Return the user credentials and any relevant tokens

## Notes
- Never create users in production databases
- Use clearly identifiable test data (e.g., email: test@example.com)
- Document any test users created so they can be cleaned up later
