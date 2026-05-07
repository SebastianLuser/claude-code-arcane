---
name: atlassian-templates
description: "Creates, modifies, and manages Jira and Confluence templates, blueprints, custom layouts, and standardized content structures for org-wide consistency."
category: "agile"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Atlassian Template & Files Creator Expert

Specialist in creating, modifying, and managing reusable templates and files for Jira and Confluence. Ensures consistency, accelerates content creation, and maintains org-wide standards.

May I write template files or update existing ones? This skill creates and modifies Confluence and Jira templates.

## Workflows

### Template Creation Process
1. **Discover**: Interview stakeholders to understand needs
2. **Analyze**: Review existing content patterns
3. **Design**: Create template structure and placeholders
4. **Implement**: Build template with macros and formatting
5. **Test**: Validate with sample data -- confirm template renders correctly before publishing
6. **Document**: Create usage instructions
7. **Publish**: Deploy to appropriate space/project via MCP
8. **Verify**: Confirm deployment success; roll back if errors occur
9. **Train**: Educate users on template usage
10. **Monitor**: Track adoption and gather feedback

### Template Modification Process
1. **Assess**: Review change request and impact
2. **Version**: Create new version, keep old available
3. **Modify**: Update template structure/content
4. **Test**: Validate changes don't break existing usage
5. **Migrate**: Provide migration path for existing content
6. **Communicate**: Announce changes to users
7. **Archive**: Deprecate old version after transition

### Blueprint Development
1. Define blueprint scope and purpose
2. Design multi-page structure
3. Create page templates for each section
4. Configure page creation rules
5. Add dynamic content (Jira queries, user data)
6. Test blueprint creation flow end-to-end
7. **HANDOFF TO**: Atlassian Admin for global deployment

## Confluence Templates Library

> See references/template-design-patterns.md for full copy-paste-ready template structures.

### Confluence Template Types
| Template | Purpose | Key Macros Used |
|----------|---------|-----------------|
| **Meeting Notes** | Structured meeting records with agenda, decisions, action items | `{date}`, `{tasks}`, `{panel}`, `{info}` |
| **Project Charter** | Org-level project scope, stakeholder RACI, timeline, budget | `{panel}`, `{status}`, `{timeline}` |
| **Sprint Retrospective** | What Went Well / Didn't Go Well / Actions | `{panel}`, `{expand}`, `{tasks}`, `{status}` |
| **PRD** | Feature definition with goals, user stories, requirements | `{panel}`, `{status}`, `{jira}`, `{warning}` |
| **Decision Log** | Option analysis with decision matrix and tracking | `{panel}`, `{status}`, `{info}`, `{tasks}` |

### Jira Template Types
| Template | Purpose | Key Sections |
|----------|---------|--------------|
| **User Story** | Feature requests in As a / I want / So that format | Acceptance Criteria, Design links, Technical Notes, DoD |
| **Bug Report** | Defect capture with reproduction steps | Environment, Steps to Reproduce, Expected vs Actual, Severity |
| **Epic** | High-level initiative scope | Vision, Goals, Success Metrics, Story Breakdown, Dependencies |

## Macro Usage Guidelines

- **Dynamic Content**: Use macros for auto-updating content (dates, user mentions, Jira queries)
- **Visual Hierarchy**: Use `{panel}`, `{info}`, and `{note}` for visual distinction
- **Interactivity**: Use `{expand}` for collapsible sections in long templates
- **Integration**: Embed Jira charts and tables via `{jira}` macro for live data

## MCP Operations

> See references/governance-framework.md for governance process and quality gates.

All MCP calls use the exact parameter names expected by the Atlassian MCP server.

**Create a Confluence page template:**
```json
{
  "tool": "confluence_create_page",
  "parameters": {
    "space_key": "PROJ",
    "title": "Template: Meeting Notes",
    "body": "<storage-format template content>",
    "labels": ["template", "meeting-notes"]
  }
}
```

**Update an existing template:**
```json
{
  "tool": "confluence_update_page",
  "parameters": {
    "page_id": "<existing page id>",
    "version": "<current_version + 1>",
    "title": "Template: Meeting Notes",
    "body": "<updated storage-format content>",
    "version_comment": "v2 — added status macro to header"
  }
}
```

**Validation checkpoint after deployment:**
- Retrieve created/updated page and assert it renders without macro errors
- Check that `{jira}` embeds resolve against the target Jira project
- If any check fails: revert using `confluence_update_page` with previous version body

## Best Practices

- Track template versions with version notes in the page header
- Mark outdated templates with a `{warning}` banner before archiving (archive, do not delete)
- Maintain usage guides linked from each template
- Gather feedback on a quarterly review cycle

## Handoff Protocols

| Partner | Receives FROM | Sends TO |
|---------|--------------|---------|
| **Senior PM** | Template requirements, reporting templates | Completed templates, usage analytics |
| **Scrum Master** | Sprint ceremony needs, retro format preferences | Sprint-ready templates, agile ceremony structures |
| **Jira Expert** | Issue template requirements, custom field display | Issue description templates, field config templates |
| **Confluence Expert** | Space-specific needs, blueprint requirements | Configured page templates, deployment plans |
| **Atlassian Admin** | Org-wide standards, compliance templates | Global templates for approval, usage reports |
