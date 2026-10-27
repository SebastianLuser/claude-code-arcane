---
name: gdocs
description: "Manage Google Docs: create, read and edit documents via the Google Docs API v1. Use when the user mentions: Google Docs, Gdocs, Google document, doc, create doc, edit doc, template in Docs."
category: "integrations"
argument-hint: "[create|read|edit] [doc-id or title]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---
# Google Docs Manager

Interacts with Google Docs via Docs API v1 + Drive API v3.

## Auth Setup

Option 1 — Service account (recommended for automation):
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

Option 2 — OAuth user flow:
```bash
# Requires the gcloud CLI
gcloud auth application-default login
```

Required scopes:
- `https://www.googleapis.com/auth/documents` (read/write docs)
- `https://www.googleapis.com/auth/drive.file` (create/share files)

## Key Operations

### Create a new doc
```bash
curl -X POST https://docs.googleapis.com/v1/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Document"}'
```
Returns `documentId`.

### Read content
```bash
curl https://docs.googleapis.com/v1/documents/$DOC_ID \
  -H "Authorization: Bearer $TOKEN"
```
Returns the body structure (paragraphs, tables, etc.).

### Edit (batch updates)
```bash
curl -X POST https://docs.googleapis.com/v1/documents/$DOC_ID:batchUpdate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {"insertText": {"location": {"index": 1}, "text": "Hello world\n"}},
      {"updateTextStyle": {
        "range": {"startIndex": 1, "endIndex": 10},
        "textStyle": {"bold": true},
        "fields": "bold"
      }}
    ]
  }'
```

### Copy a template
```bash
# Drive API
curl -X POST "https://www.googleapis.com/drive/v3/files/$TEMPLATE_ID/copy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New copy of the document"}'
```

### Replace placeholders
```json
{
  "requests": [
    {"replaceAllText": {
      "containsText": {"text": "{{TITLE}}", "matchCase": true},
      "replaceText": "My real title"
    }},
    {"replaceAllText": {
      "containsText": {"text": "{{DATE}}"},
      "replaceText": "2026-04-12"
    }}
  ]
}
```

## Commands

### Create a doc from a template
```
/gdocs from-template <template_id> [variables]
```

Flow:
1. Copy the template to the destination Drive
2. Replace the {{...}} placeholders with values
3. Share with stakeholders if specified
4. Return the URL

### Generate a doc from markdown
```
/gdocs from-markdown <file.md> "title"
```

Converts markdown to Docs API requests:
- `# H1` → heading style
- `**bold**` → bold text style
- lists → bulleted lists
- tables → insertTable
- links → textStyle with link
- code blocks → courier font + gray background

### Extract content to markdown
```
/gdocs export <doc_id>
```
GET the doc → parse the structure → output markdown.

## Rules

- **Document structure is NOT plain text**. Use batchUpdate, never overwrite with plain text.
- **Indexes in Docs are character-based** (Unicode). Compute them carefully on insert/delete.
- **Revisions**: every batchUpdate creates a revision. Frequent saves = many revisions, that's OK.
- **Permissions via the Drive API**: `POST /drive/v3/files/{id}/permissions` to share.
- **Limits**: 1MB max per doc, 1000 req/100s/user for the Docs API.
