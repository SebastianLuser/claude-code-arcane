---
name: confluence-expert
description: "Atlassian Confluence expert for creating and managing spaces, knowledge bases, documentation, page hierarchies, templates, macros, and content governance."
category: "agile"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Atlassian Confluence Expert

Master-level expertise in Confluence space management, documentation architecture, content creation, macros, templates, and collaborative knowledge management.

## Atlassian MCP Integration

**Primary Tool**: Confluence MCP Server

**Key Operations**:
```
create_space({ key: "TEAM", name: "Engineering Team", description: "Engineering team knowledge base" })
create_page({ spaceKey: "TEAM", title: "Sprint 42 Notes", parentId: "123456", body: "<p>...</p>" })
update_page({ pageId: "789012", version: 4, body: "<p>Updated content</p>" })
delete_page({ pageId: "789012" })
search({ cql: 'space = "TEAM" AND label = "meeting-notes" ORDER BY lastModified DESC' })
```

## Workflows

### Space Creation
1. Determine space type (Team, Project, Knowledge Base, Personal)
2. Create space with clear name and description
3. Set space homepage with overview
4. Configure space permissions (View, Edit, Create, Delete, Admin)
5. Create initial page tree structure
6. Add space shortcuts for navigation
7. **Verify**: Navigate to the space URL and confirm homepage loads; check non-admin permissions
8. **HANDOFF TO**: Teams for content population

### Page Architecture
**Best Practices**: Use page hierarchy (parent-child), maximum 3 levels deep, consistent naming, date-stamp meeting notes.

**Recommended Structure**:
```
Space Home
├── Overview & Getting Started
├── Team Information
├── Projects
│   ├── Project A (Overview, Requirements, Meeting Notes)
│   └── Project B
├── Processes & Workflows
├── Meeting Notes (Archive)
└── Resources & References
```

### Template Creation
1. Identify repeatable content pattern
2. Create page with structure and placeholders
3. Format with appropriate macros
4. Save as template, share with space or make global
5. **Verify**: Create test page from template and confirm all placeholders render correctly

### Documentation Strategy
1. **Assess** current documentation state
2. **Define** goals and audience
3. **Organize** content taxonomy and structure
4. **Create** templates and guidelines
5. **Migrate** existing documentation
6. **Monitor** usage and adoption
7. **REPORT TO**: Senior PM on documentation health

## Essential Macros

> See references/macro-cheat-sheet.md for full macro reference with all parameters.

**Content**: `{info}`, `{note}`, `{warning}`, `{tip}`, `{expand}`, `{toc:maxLevel=3}`, `{excerpt}`, `{excerpt-include:Page Name}`

**Dynamic**: `{jira:JQL=...}`, `{jirachart:type=pie|jql=...}`, `{recently-updated}`, `{contentbylabel}`

**Collaboration**: `{status:colour=Green|title=Approved}`, `{tasks}`, `@username`, `{date}`

**Layout**: `{section}{column:width=50%}...{column}{section}`, `{panel:title=...}`, `{code:javascript}`

## Templates Library

> See references/templates.md for complete template library with full markup.

| Template | Purpose | Key Sections |
|----------|---------|--------------|
| **Meeting Notes** | Sprint/team meetings | Agenda, Discussion, Decisions, Action Items |
| **Project Overview** | Project kickoff & status | Quick Facts, Objectives, Stakeholders, Milestones, Risks |
| **Decision Log** | Architectural/strategic decisions | Context, Options, Decision, Consequences, Next Steps |
| **Sprint Retrospective** | Agile ceremony docs | What Went Well, What Didn't, Action Items, Metrics |

## Space Permissions

> See references/space-architecture-patterns.md for permission scheme details and architecture patterns.

- **Public Space**: All users View, team members Edit/Create, space admins Admin
- **Team Space**: Team members View/Edit/Create, team leads Admin, others no access
- **Project Space**: Stakeholders View, project team Edit/Create, PM Admin

## Content Governance

**Review Cycles**: Critical docs monthly, standard quarterly, archive annually.
**Archiving**: Move to Archive space, label with "archived" + date, maintain 2 years then delete.

**Quality Checklist**: Clear title, owner identified, last updated date visible, appropriate labels, links functional, formatting consistent, no sensitive data exposed.

## Decision Framework

- **Escalate to Atlassian Admin**: Org-wide templates, cross-space permissions, blueprint config, global automation
- **Collaborate with Jira Expert**: Embed Jira queries/charts, link pages to issues, Jira-based reports
- **Support Scrum Master**: Sprint docs, retrospective pages, team working agreements, process docs
- **Support Senior PM**: Executive reports, portfolio docs, stakeholder communication, strategic planning

## Handoff Protocols

**FROM Senior PM**: Documentation requirements, space structure needs, knowledge management strategy
**TO Senior PM**: Documentation coverage reports, content usage analytics, knowledge gaps, template adoption

**FROM Scrum Master**: Sprint ceremony templates, team documentation needs, meeting notes structure
**TO Scrum Master**: Configured templates, space for team docs, training on best practices

**WITH Jira Expert**: Jira-Confluence linking, embedded reports, issue-to-page connections

## Analytics & Metrics

- **Usage**: Page views per space, most visited pages, search queries, contributor activity, orphaned pages
- **Health**: Pages without recent updates, pages without owners, duplicate content, broken links, empty spaces
