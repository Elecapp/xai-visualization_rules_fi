#!/usr/bin/env python3
"""
Run this script whenever new explanations are generated.
It scans every *_explanations folder inside ./static and prints
the <option> tags ready to be pasted into index.html.
"""

import os
import re
from pathlib import Path

STATIC_DIR = Path(__file__).parent / "static"


def dataset_label(folder_name: str) -> str:
    """Turn 'german_explanations' → 'German'."""
    return folder_name.replace("_explanations", "").replace("_", " ").title()


def instance_number(filename: str) -> int:
    """Extract the numeric part of 'instance_42.json' → 42."""
    m = re.search(r"(\d+)", filename)
    return int(m.group(1)) if m else 0


options = []

for folder in sorted(STATIC_DIR.iterdir()):
    if not (folder.is_dir() and folder.name.endswith("_explanations")):
        continue

    label = dataset_label(folder.name)
    json_files = sorted(
        [f for f in folder.iterdir() if f.suffix == ".json"],
        key=lambda f: instance_number(f.name),
    )

    for json_file in json_files:
        instance_id = instance_number(json_file.name)
        value = f"/static/{folder.name}/{json_file.name}"
        options.append(
            f'      <option value="{value}">{label} - Instance {instance_id}</option>'
        )

print("\n".join(options))

