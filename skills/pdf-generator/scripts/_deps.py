# SPDX-License-Identifier: MIT
"""Dependency check shared by the pdf-generator scripts."""

import importlib.util
import sys


def require(*packages: str) -> None:
    """Exit with the install command when a package is missing; never install anything."""
    missing = [p for p in packages if importlib.util.find_spec(p) is None]
    if missing:
        sys.stderr.write(f"[ERROR] missing Python package(s): {', '.join(missing)}\n"
                         f"Install with: {sys.executable} -m pip install {' '.join(missing)}\n")
        sys.exit(2)
