#!/bin/bash
# Hook: detect-gaps.sh
# Event: SessionStart
# Purpose: Detect missing documentation based on project stack (software or gamedev)
# Cross-platform: Windows Git Bash compatible (uses grep -E, not -P)

set +e

echo "=== Checking for Documentation Gaps ==="

# --- Stack detection ---
IS_GAMEDEV=false
IS_SOFTWARE=false
STACK="unknown"

# Gamedev markers
if [ -f "ProjectSettings/ProjectVersion.txt" ] || [ -f "project.godot" ]; then
  IS_GAMEDEV=true
fi
if ls *.uproject 2>/dev/null | grep -q .; then
  IS_GAMEDEV=true
fi
if [ -d "design/gdd" ] || [ -d "src/gameplay" ]; then
  IS_GAMEDEV=true
fi

# Software markers
if [ -f "package.json" ] || [ -f "go.mod" ] || [ -f "Cargo.toml" ] || [ -f "pyproject.toml" ] || [ -f "requirements.txt" ] || [ -f "pubspec.yaml" ]; then
  IS_SOFTWARE=true
fi

if [ "$IS_GAMEDEV" = true ] && [ "$IS_SOFTWARE" = true ]; then
  STACK="mixed"
elif [ "$IS_GAMEDEV" = true ]; then
  STACK="gamedev"
elif [ "$IS_SOFTWARE" = true ]; then
  STACK="software"
fi

# --- Fresh project detection ---
FRESH_PROJECT=true

if [ -d "src" ]; then
  SRC_CHECK=$(find src -type f \( -name "*.gd" -o -name "*.cs" -o -name "*.cpp" -o -name "*.c" -o -name "*.h" -o -name "*.hpp" -o -name "*.rs" -o -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.go" -o -name "*.java" -o -name "*.kt" -o -name "*.dart" \) 2>/dev/null | head -1)
  if [ -n "$SRC_CHECK" ]; then
    FRESH_PROJECT=false
  fi
fi

if [ "$IS_GAMEDEV" = true ] || [ "$IS_SOFTWARE" = true ]; then
  FRESH_PROJECT=false
fi

if [ "$FRESH_PROJECT" = true ]; then
  echo ""
  echo "NEW PROJECT: no stack detected, no source code."
  echo "   Run: /start to begin the guided onboarding"
  echo "==================================="
  exit 0
fi

echo "Stack: $STACK"
echo ""

# ============================================================
# GAMEDEV CHECKS
# ============================================================
if [ "$IS_GAMEDEV" = true ]; then
  if [ -d "src" ]; then
    GAMEDEV_SRC=$(find src -type f \( -name "*.gd" -o -name "*.cs" -o -name "*.cpp" -o -name "*.c" -o -name "*.h" -o -name "*.hpp" \) 2>/dev/null | wc -l)
  else
    GAMEDEV_SRC=0
  fi
  GAMEDEV_SRC=$(echo "$GAMEDEV_SRC" | tr -d ' ')

  if [ -d "design/gdd" ]; then
    DESIGN_FILES=$(find design/gdd -type f -name "*.md" 2>/dev/null | wc -l)
  else
    DESIGN_FILES=0
  fi
  DESIGN_FILES=$(echo "$DESIGN_FILES" | tr -d ' ')

  if [ "$GAMEDEV_SRC" -gt 50 ] && [ "$DESIGN_FILES" -lt 5 ]; then
    echo "GAP [gamedev]: $GAMEDEV_SRC source files but only $DESIGN_FILES GDD docs"
    echo "    Suggested: /reverse-document design src/[system]"
  fi

  # Prototypes without docs
  if [ -d "prototypes" ]; then
    PROTOTYPE_DIRS=$(find prototypes -mindepth 1 -maxdepth 1 -type d 2>/dev/null)
    UNDOCUMENTED_PROTOS=()
    if [ -n "$PROTOTYPE_DIRS" ]; then
      while IFS= read -r proto_dir; do
        proto_dir=$(echo "$proto_dir" | sed 's|\\|/|g')
        if [ ! -f "${proto_dir}/README.md" ] && [ ! -f "${proto_dir}/CONCEPT.md" ]; then
          UNDOCUMENTED_PROTOS+=("$(basename "$proto_dir")")
        fi
      done <<< "$PROTOTYPE_DIRS"
      if [ ${#UNDOCUMENTED_PROTOS[@]} -gt 0 ]; then
        echo "GAP [gamedev]: ${#UNDOCUMENTED_PROTOS[@]} undocumented prototype(s)"
        for proto in "${UNDOCUMENTED_PROTOS[@]}"; do
          echo "    - prototypes/$proto/ (no README/CONCEPT)"
        done
      fi
    fi
  fi

  # Gameplay systems without design docs
  if [ -d "src/gameplay" ]; then
    GAMEPLAY_SYSTEMS=$(find src/gameplay -mindepth 1 -maxdepth 1 -type d 2>/dev/null)
    if [ -n "$GAMEPLAY_SYSTEMS" ]; then
      while IFS= read -r system_dir; do
        system_dir=$(echo "$system_dir" | sed 's|\\|/|g')
        system_name=$(basename "$system_dir")
        file_count=$(find "$system_dir" -type f 2>/dev/null | wc -l)
        file_count=$(echo "$file_count" | tr -d ' ')
        if [ "$file_count" -ge 5 ]; then
          if [ ! -f "design/gdd/${system_name}-system.md" ] && [ ! -f "design/gdd/${system_name}.md" ]; then
            echo "GAP [gamedev]: src/gameplay/$system_name/ ($file_count files) has no design doc"
          fi
        fi
      done <<< "$GAMEPLAY_SYSTEMS"
    fi
  fi
fi

# ============================================================
# SOFTWARE CHECKS
# ============================================================
if [ "$IS_SOFTWARE" = true ]; then
  if [ -d "src" ]; then
    SOFTWARE_SRC=$(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.go" -o -name "*.py" -o -name "*.rs" -o -name "*.java" -o -name "*.kt" -o -name "*.dart" \) 2>/dev/null | wc -l)
  else
    SOFTWARE_SRC=0
  fi
  SOFTWARE_SRC=$(echo "$SOFTWARE_SRC" | tr -d ' ')

  # Test coverage (files, not lines)
  TEST_FILES=0
  for dir in tests test __tests__ spec; do
    if [ -d "$dir" ]; then
      count=$(find "$dir" -type f \( -name "*.test.*" -o -name "*.spec.*" -o -name "*_test.go" -o -name "test_*.py" \) 2>/dev/null | wc -l)
      TEST_FILES=$((TEST_FILES + count))
    fi
  done
  if [ -d "src" ]; then
    COLOC=$(find src -type f \( -name "*.test.*" -o -name "*.spec.*" -o -name "*_test.go" \) 2>/dev/null | wc -l)
    TEST_FILES=$((TEST_FILES + COLOC))
  fi

  if [ "$SOFTWARE_SRC" -gt 20 ] && [ "$TEST_FILES" -lt 3 ]; then
    echo "GAP [software]: $SOFTWARE_SRC source files but only $TEST_FILES test files"
    echo "    Suggested: add tests for critical paths"
  fi

  # README
  if [ "$SOFTWARE_SRC" -gt 10 ] && [ ! -f "README.md" ]; then
    echo "GAP [software]: codebase exists but no README.md at root"
    echo "    Suggested: document setup, usage, architecture"
  fi

  # CI
  if [ "$SOFTWARE_SRC" -gt 20 ]; then
    HAS_CI=false
    [ -d ".github/workflows" ] && HAS_CI=true
    [ -f ".gitlab-ci.yml" ] && HAS_CI=true
    [ -f ".circleci/config.yml" ] && HAS_CI=true
    [ -f "Jenkinsfile" ] && HAS_CI=true
    if [ "$HAS_CI" = false ]; then
      echo "GAP [software]: non-trivial codebase but no CI detected"
      echo "    Suggested: add .github/workflows/ci.yml"
    fi
  fi

  # API without contract
  if [ -d "src/api" ] || [ -d "src/routes" ] || [ -d "src/handlers" ] || [ -d "src/controllers" ]; then
    HAS_CONTRACT=false
    [ -d "design/api" ] && HAS_CONTRACT=true
    if find . -maxdepth 4 \( -name "*.openapi.yaml" -o -name "*.openapi.yml" -o -name "openapi.json" \) 2>/dev/null | grep -q .; then HAS_CONTRACT=true; fi
    if find . -maxdepth 4 -name "*.proto" 2>/dev/null | grep -q .; then HAS_CONTRACT=true; fi
    if find . -maxdepth 4 -name "schema.graphql" 2>/dev/null | grep -q .; then HAS_CONTRACT=true; fi
    if [ "$HAS_CONTRACT" = false ]; then
      echo "GAP [software]: API code detected but no contract (OpenAPI/GraphQL/.proto)"
      echo "    Suggested: add design/api/[service].openapi.yaml"
    fi
  fi

  # DB client without migrations dir
  DB_HINT=false
  for f in package.json go.mod Cargo.toml pyproject.toml requirements.txt; do
    if [ -f "$f" ] && grep -qE "postgres|postgresql|mysql|mongodb|sqlite|prisma|gorm|sqlalchemy|alembic|knex|typeorm|sequelize|diesel" "$f" 2>/dev/null; then
      DB_HINT=true
      break
    fi
  done
  if [ "$DB_HINT" = true ]; then
    HAS_MIGRATIONS=false
    for dir in migrations db/migrations prisma/migrations alembic/versions; do
      [ -d "$dir" ] && HAS_MIGRATIONS=true
    done
    if [ "$HAS_MIGRATIONS" = false ]; then
      echo "GAP [software]: DB dependencies found but no migrations/ directory"
    fi
  fi

  # ADRs for substantial codebases
  if [ "$SOFTWARE_SRC" -gt 50 ]; then
    if [ ! -d "docs/architecture" ]; then
      echo "GAP [software]: substantial codebase but no docs/architecture/ for ADRs"
    fi
  fi
fi

# ============================================================
# UNIVERSAL CHECKS (both stacks)
# ============================================================
if [ -d "src" ]; then
  SRC_TOTAL=$(find src -type f 2>/dev/null | wc -l)
  SRC_TOTAL=$(echo "$SRC_TOTAL" | tr -d ' ')
  if [ "$SRC_TOTAL" -gt 100 ]; then
    if [ ! -d "production/sprints" ] && [ ! -d "production/milestones" ]; then
      echo "GAP [universal]: large codebase ($SRC_TOTAL files) but no production/ planning"
    fi
  fi
fi

echo ""
echo "Run /project-stage-detect for full analysis"
echo "==================================="
exit 0
