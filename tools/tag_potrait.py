"""
tag_portrait.py
Cluster paths in a traced SVG portrait into semantic groups, then emit:
  1. <input>-tagged.svg     -> original SVG with <g id="..."> wrappers
  2. <input>-debug.svg      -> each cluster recolored, for visual verification
  3. clusters/<group>.png   -> one PNG per cluster (only that group's paths visible)

Tuned for the "portrait-twists-puff" SVG: 768x768 canvas, frontal portrait,
two-puff hair, yellow shirt. Tweak REGIONS for other portraits.

Dependencies:
    pip install svgpathtools cairosvg numpy

Usage:
    python tag_portrait.py portrait-twists-puff-svgo.svg
"""

import os
import sys
import re
import xml.etree.ElementTree as ET
from pathlib import Path

import numpy as np
from svgpathtools import parse_path
import cairosvg


# -----------------------------------------------------------------------------
# Region definitions — (x_min, y_min, x_max, y_max) on the 768x768 canvas.
# Order matters: paths are assigned to the FIRST region they fit. Put smaller,
# more specific regions before larger ones (eyes before face_base, etc).
# -----------------------------------------------------------------------------
REGIONS = [
    # name,            x0,  y0,  x1,  y1,   color_band_filter (or None)
    # Eyes — widened to catch outline strokes
    ("eye-right",      290, 310, 385, 365,  "dark"),
    ("eye-left",       395, 310, 490, 365,  "dark"),
    # Eyebrows — sit just above eyes
    ("eyebrow-right",  290, 280, 385, 315,  "dark"),
    ("eyebrow-left",   395, 280, 490, 315,  "dark"),
    # Nose — narrow column between eyes and lips
    ("nose",           355, 340, 420, 415,  None),
    # Lips — narrowed horizontally to stop grabbing jaw/chin strokes
    ("lips",           355, 415, 430, 460,  None),
    # Earrings — gold filter (now relaxed in color_band())
    ("earring-right",  230, 360, 320, 450,  "gold"),
    ("earring-left",   490, 360, 580, 450,  "gold"),
    # Hair silhouette — large catch-all for hair contour strokes that
    # span between/above the two puffs. Comes BEFORE puff boxes so it
    # grabs the long outline contours first.
    ("hair-silhouette", 175, 0,  480, 200,  "dark"),
    # Hair front bangs — middle section over forehead
    ("hair-front",     320, 195, 470, 290,  "dark"),
    # Hair puffs — split exactly at canvas midline
    ("hair-puff-right", 100, 0, 384, 290,   "dark"),
    ("hair-puff-left", 384, 0, 680, 290,    "dark"),
    # Neck — between jaw and shirt collar
    ("neck",           315, 475, 475, 555,  None),
    # Shirt — large bottom region, widened to catch corner detail
    ("shirt",            0, 540, 768, 768,  None),
    # Face — catch-all for remaining facial skin
    ("face",           240, 220, 540, 510,  None),
]


# -----------------------------------------------------------------------------
# Color band classification. Strokes get bucketed by lightness + saturation.
# -----------------------------------------------------------------------------
def hex_to_rgb(hex_str):
    """Convert '#aabbcc' -> (170, 187, 204)."""
    h = hex_str.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def color_band(hex_str):
    """Classify a hex color into a tonal band: dark, mid, light, gold."""
    r, g, b = hex_to_rgb(hex_str)
    lightness = (r + g + b) / 3
    # Gold = warm hue with red dominant over blue, moderately saturated.
    # Relaxed from earlier filter to catch muted earring/shirt-fold golds.
    if r > 130 and r > b + 60 and g > 70 and b < 110:
        return "gold"
    if lightness < 70:
        return "dark"
    if lightness < 130:
        return "mid"
    return "light"


# -----------------------------------------------------------------------------
# Path parsing & centroid computation
# -----------------------------------------------------------------------------
SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)


def split_path_at_moves(d_attr):
    """
    Split a path's 'd' attribute into a list of sub-path 'd' attributes,
    one per moveto (M or m) command. Each sub-path becomes its own path.

    Example:
      "M10,10 L20,20 M50,50 L60,60" -> ["M10,10 L20,20", "M50,50 L60,60"]
    """
    # Find positions of all M/m commands (start of sub-paths)
    # A moveto is M or m followed by coordinates. We split BEFORE each
    # M/m except the first one.
    matches = list(re.finditer(r'[Mm]', d_attr))
    if len(matches) <= 1:
        return [d_attr]  # only one sub-path, nothing to split

    sub_paths = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(d_attr)
        sub_paths.append(d_attr[start:end].strip())
    return sub_paths


def explode_paths(root):
    """
    Walk the SVG tree and replace every <path> with multiple <path> elements,
    one per sub-path (split at M commands). Preserves all other attributes.
    Returns the new flat list of path elements (in document order).
    """
    new_paths = []
    paths_to_remove = []
    paths_to_insert = []  # list of (parent, index, [new_path_elements])

    # Collect all paths and their parents
    for parent in root.iter():
        children = list(parent)
        for idx, child in enumerate(children):
            if not child.tag.endswith("}path"):
                continue
            d = child.get("d", "")
            sub_ds = split_path_at_moves(d)
            if len(sub_ds) == 1:
                new_paths.append(child)
                continue
            # Create one new path element per sub-path
            replacements = []
            for sub_d in sub_ds:
                new_el = ET.Element(f"{{{SVG_NS}}}path")
                for attr, val in child.attrib.items():
                    new_el.set(attr, val)
                new_el.set("d", sub_d)
                replacements.append(new_el)
                new_paths.append(new_el)
            paths_to_insert.append((parent, child, replacements))

    # Apply replacements (do this after iteration to avoid mutation issues)
    for parent, old_child, replacements in paths_to_insert:
        idx = list(parent).index(old_child)
        parent.remove(old_child)
        for offset, new_el in enumerate(replacements):
            parent.insert(idx + offset, new_el)

    return new_paths


def path_centroid_and_bbox(d_attr):
    """Return ((cx, cy), (x0, y0, x1, y1)) for a path's 'd' attribute."""
    try:
        path = parse_path(d_attr)
        x0, x1, y0, y1 = path.bbox()
        return ((x0 + x1) / 2, (y0 + y1) / 2), (x0, y0, x1, y1)
    except Exception:
        return None, None


# -----------------------------------------------------------------------------
# Region assignment
# -----------------------------------------------------------------------------
def bbox_overlap_area(bbox, region_box):
    """Return the area of overlap between two boxes."""
    bx0, by0, bx1, by1 = bbox
    rx0, ry0, rx1, ry1 = region_box
    ox = max(0, min(bx1, rx1) - max(bx0, rx0))
    oy = max(0, min(by1, ry1) - max(by0, ry0))
    return ox * oy


def assign_region(centroid, bbox, band):
    """
    Assign a path to a region by mutual coverage score.

    For each candidate region, compute:
      - coverage_of_path:   overlap_area / path_bbox_area   ("how much of
                            the path is in this region?")
      - coverage_of_region: overlap_area / region_area      ("how much of
                            the region does this path span?")
    Score = min(coverage_of_path, coverage_of_region).

    This bottleneck score captures both "small path inside small region"
    (high score in both, wins) and "long path covering large region"
    (high score in both, wins), while penalizing "small path in giant
    region" or "long path crossing tiny region" (one score is low).

    Falls back to centroid-in-box if no overlap.
    """
    cx, cy = centroid
    bx0, by0, bx1, by1 = bbox
    path_area = max(1, (bx1 - bx0) * (by1 - by0))

    best_region = None
    best_score = 0
    for name, x0, y0, x1, y1, band_filter in REGIONS:
        if band_filter is not None and band != band_filter:
            continue
        overlap = bbox_overlap_area(bbox, (x0, y0, x1, y1))
        if overlap == 0:
            continue
        region_area = max(1, (x1 - x0) * (y1 - y0))
        cov_path = overlap / path_area
        cov_region = overlap / region_area
        score = min(cov_path, cov_region)
        if score > best_score:
            best_score = score
            best_region = name
    if best_region is not None:
        return best_region
    # Centroid fallback
    for name, x0, y0, x1, y1, band_filter in REGIONS:
        if band_filter is not None and band != band_filter:
            continue
        if x0 <= cx <= x1 and y0 <= cy <= y1:
            return name
    return None


# -----------------------------------------------------------------------------
# Debug palette — distinct colors for each cluster
# -----------------------------------------------------------------------------
DEBUG_PALETTE = [
    "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe",
    "#008080", "#e6beff", "#9a6324", "#fffac8", "#800000",
    "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080",
]


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
def main(input_path):
    input_path = Path(input_path)
    if not input_path.exists():
        print(f"Error: {input_path} not found", file=sys.stderr)
        sys.exit(1)

    output_dir = input_path.parent
    stem = input_path.stem
    tagged_path = output_dir / f"{stem}-tagged.svg"
    debug_path = output_dir / f"{stem}-debug.svg"
    cluster_dir = output_dir / "clusters"
    cluster_dir.mkdir(exist_ok=True)

    # Parse input SVG
    tree = ET.parse(input_path)
    root = tree.getroot()
    viewbox = root.get("viewBox", "0 0 768 768")

    # Pre-processing: split multi-subpath <path> elements so that each
    # sub-path (between M commands) becomes its own <path>. This fixes
    # centroid-based clustering for traced SVGs where one path crosses
    # multiple semantic regions.
    paths_before = len(root.findall(f"{{{SVG_NS}}}path"))
    paths = explode_paths(root)
    print(f"Path explosion: {paths_before} -> {len(paths)} paths")

    # Assign each path to a region
    assignments = {}  # path_idx -> region_name
    for i, path_el in enumerate(paths):
        d = path_el.get("d", "")
        stroke = path_el.get("stroke", "#000000")
        centroid, bbox = path_centroid_and_bbox(d)
        if centroid is None or bbox is None:
            assignments[i] = "unassigned"
            continue
        band = color_band(stroke)
        region = assign_region(centroid, bbox, band)
        assignments[i] = region or "unassigned"

    # Print summary
    from collections import Counter
    counts = Counter(assignments.values())
    print("\nCluster assignments:")
    for name, count in counts.most_common():
        print(f"  {name:20s} {count:4d} paths")

    # ------------------------------------------------------------------
    # 1. Build tagged SVG: wrap each cluster in <g id="...">
    # ------------------------------------------------------------------
    tagged_root = ET.Element(f"{{{SVG_NS}}}svg", {
        "viewBox": viewbox,
    })

    # Copy non-path children first (rect backgrounds, defs, etc.)
    for child in root:
        if not child.tag.endswith("}path"):
            tagged_root.append(child)

    # Group paths by region
    by_region = {}
    for i, region in assignments.items():
        by_region.setdefault(region, []).append(i)

    for region, idxs in by_region.items():
        g = ET.SubElement(tagged_root, f"{{{SVG_NS}}}g", {"id": region})
        for i in idxs:
            g.append(paths[i])

    ET.ElementTree(tagged_root).write(tagged_path, encoding="utf-8",
                                       xml_declaration=True)
    print(f"\n[OK] Wrote {tagged_path}")

    # ------------------------------------------------------------------
    # 2. Build debug SVG: recolor each cluster
    # ------------------------------------------------------------------
    debug_root = ET.Element(f"{{{SVG_NS}}}svg", {
        "viewBox": viewbox,
    })
    region_colors = {}
    for idx, region in enumerate(sorted(by_region.keys())):
        region_colors[region] = DEBUG_PALETTE[idx % len(DEBUG_PALETTE)]

    for region, idxs in by_region.items():
        color = region_colors[region]
        g = ET.SubElement(debug_root, f"{{{SVG_NS}}}g", {"id": region})
        for i in idxs:
            # Clone path with new stroke color
            orig = paths[i]
            new_path = ET.SubElement(g, f"{{{SVG_NS}}}path")
            for attr, val in orig.attrib.items():
                if attr == "stroke":
                    continue
                new_path.set(attr, val)
            new_path.set("stroke", color)
            new_path.set("stroke-width", "2")

    ET.ElementTree(debug_root).write(debug_path, encoding="utf-8",
                                      xml_declaration=True)
    print(f"[OK] Wrote {debug_path}")

    # ------------------------------------------------------------------
    # 3. Per-cluster PNGs: render one image per group with only that
    #    cluster visible (others kept faintly for context)
    # ------------------------------------------------------------------
    print(f"\nRendering per-cluster PNGs to {cluster_dir}/ ...")
    for region in sorted(by_region.keys()):
        sub_root = ET.Element(f"{{{SVG_NS}}}svg", {
            "viewBox": viewbox,
        })
        for child in root:
            if not child.tag.endswith("}path"):
                sub_root.append(child)

        for i, path_el in enumerate(paths):
            if assignments[i] != region:
                continue
            new_path = ET.SubElement(sub_root, f"{{{SVG_NS}}}path")
            for attr, val in path_el.attrib.items():
                new_path.set(attr, val)

        svg_bytes = ET.tostring(sub_root, encoding="utf-8",
                                xml_declaration=True)
        png_path = cluster_dir / f"{region}.png"
        cairosvg.svg2png(bytestring=svg_bytes,
                         write_to=str(png_path),
                         output_width=512)
        print(f"  {png_path}")

    print("\nDone. Inspect:")
    print(f"  - {debug_path} (open in browser)")
    print(f"  - {cluster_dir}/*.png (one per cluster)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python tag_portrait.py <input.svg>")
        sys.exit(1)
    main(sys.argv[1])