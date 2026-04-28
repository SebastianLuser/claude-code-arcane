# GitHub Projects v2 — GraphQL Reference

## Obtener project ID y fields

```graphql
query GetProject($org: String!, $number: Int!) {
  organization(login: $org) {
    projectV2(number: $number) {
      id
      title
      fields(first: 20) {
        nodes {
          ... on ProjectV2Field {
            id
            name
            dataType
          }
          ... on ProjectV2SingleSelectField {
            id
            name
            options {
              id
              name
              color
            }
          }
          ... on ProjectV2IterationField {
            id
            name
            configuration {
              iterations {
                id
                title
                startDate
                duration
              }
            }
          }
        }
      }
    }
  }
}
```

## Listar items de un project

```graphql
query GetProjectItems($projectId: ID!, $cursor: String) {
  node(id: $projectId) {
    ... on ProjectV2 {
      items(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          fieldValues(first: 10) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2SingleSelectField { name } }
              }
              ... on ProjectV2ItemFieldTextValue {
                text
                field { ... on ProjectV2Field { name } }
              }
              ... on ProjectV2ItemFieldNumberValue {
                number
                field { ... on ProjectV2Field { name } }
              }
            }
          }
          content {
            ... on Issue {
              title
              number
              state
              url
              assignees(first: 3) { nodes { login } }
              labels(first: 5) { nodes { name color } }
            }
            ... on PullRequest {
              title
              number
              state
              url
            }
            ... on DraftIssue {
              title
              body
            }
          }
        }
      }
    }
  }
}
```

## Actualizar field value (single select)

```graphql
mutation UpdateStatus($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $projectId
    itemId: $itemId
    fieldId: $fieldId
    value: { singleSelectOptionId: $optionId }
  }) {
    projectV2Item { id }
  }
}
```

## Actualizar field de texto o número

```graphql
mutation UpdateField($projectId: ID!, $itemId: ID!, $fieldId: ID!) {
  # Texto:
  updateProjectV2ItemFieldValue(input: {
    projectId: $projectId
    itemId: $itemId
    fieldId: $fieldId
    value: { text: "nuevo valor" }
  }) {
    projectV2Item { id }
  }
}
```

## Agregar issue/PR al project

```graphql
mutation AddItem($projectId: ID!, $contentId: ID!) {
  addProjectV2ItemById(input: {
    projectId: $projectId
    contentId: $contentId
  }) {
    item { id }
  }
}
```

## Crear draft item

```graphql
mutation CreateDraft($projectId: ID!, $title: String!, $body: String) {
  addProjectV2DraftIssue(input: {
    projectId: $projectId
    title: $title
    body: $body
  }) {
    projectItem { id }
  }
}
```

## Eliminar item del project

```graphql
mutation RemoveItem($projectId: ID!, $itemId: ID!) {
  deleteProjectV2Item(input: {
    projectId: $projectId
    itemId: $itemId
  }) {
    deletedItemId
  }
}
```

## Ejecutar queries con gh CLI

```bash
# Query básica
gh api graphql -f query='
  query {
    organization(login: "educabot") {
      projectV2(number: 1) { id title }
    }
  }
'

# Con variables
gh api graphql \
  -f query="$(cat query.graphql)" \
  -f org="educabot" \
  -F number=1

# Mutation
gh api graphql \
  -f query='mutation { updateProjectV2ItemFieldValue(input: { ... }) { projectV2Item { id } } }'
```

## IDs importantes — cómo obtenerlos

```bash
# Project ID (PVT_...)
gh project list --owner educabot --format json | jq '.[0].id'

# Field IDs
gh api graphql -f query='...' | jq '.data.organization.projectV2.fields.nodes[] | {id, name}'

# Item ID (PVTI_...)
gh project item-list 1 --owner educabot --format json | jq '.[0].id'

# Issue/PR content ID (para addProjectV2ItemById)
gh api repos/educabot/repo/issues/123 | jq '.node_id'
```
