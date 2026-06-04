import os
import json

PUBLIC_ICONS_DIR = "public/icons"
OUTPUT_FILE = "src/plugins/plugins/file-icons-data.ts"

def main():
    with open(os.path.join(PUBLIC_ICONS_DIR, "icon-map.json"), "r", encoding="utf-8") as f:
        icon_map = json.load(f)

    svgs = {}
    for filename in os.listdir(PUBLIC_ICONS_DIR):
        if filename.endswith(".svg"):
            name = filename[:-4]
            with open(os.path.join(PUBLIC_ICONS_DIR, filename), "r", encoding="utf-8") as f:
                content = f.read().strip()
                # Optimize a tiny bit by stripping newlines if desired, but let's just keep it safe
                svgs[name] = content

    ts_content = f"""// AUTO-GENERATED FILE. DO NOT EDIT.

export const iconMap = {json.dumps(icon_map, separators=(',', ':'))};

export const svgData: Record<string, string> = {json.dumps(svgs, separators=(',', ':'))};
"""

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(ts_content)

    print(f"Generated {OUTPUT_FILE} with {len(svgs)} SVGs.")

if __name__ == "__main__":
    main()
