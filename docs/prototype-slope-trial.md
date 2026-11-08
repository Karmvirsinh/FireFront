# Illustrative prototype slope capability trial — 2026-11-08

Checkpoint **98b1bec — feat: refine terrain surfaces mesh comparison and scan coverage** preserves the preceding rendering refinement. User feedback: higher resolution gives modest improvement, **129 remains default**; trail scan coverage improved; materials remain unaccepted because detail looks uniformly mottled. No complete manual checklist pass is claimed. This slope trial does not change those materials.

## Current rule

Only the isolated terrain-art prototype uses a **50° maximum permitted terrain slope**. This is an illustrative trial, not calibrated human climbing ability. No agent integration, speed penalty, stamina, climbing animation, damage or forest traversal is added.

| Ground cell | Scan |
| --- | --- |
| Both coarse triangle faces at 0–20°, physically clear | Pale dot |
| Above 20° through 50°, physically clear | Yellow/orange triangle |
| Above 50°, or another physical blocker | Red X, nonlethal |

Both limits are inclusive, with the same small numerical gradient tolerance as existing slope checks. Inspection keeps three separate answers: whether slope is suitable, whether a physical blocker exists, and whether Path-first permits the cell. Suitable off-path grass stays outside Path-first. Dense forest and rock stay blocked even below 50°. Decorative canopy overlap alone is never a blocker.

Eligibility is implemented in **src/prototype/prototypeTraversal.js**, not just scan colors. Cell checks use both full-face gradients; edge checks enforce cardinal adjacency, physical eligibility, optional Path-first permission and the two sampled half-cell transitions. The connectivity helper and final prototype trail validation use the same capability. Static baseWalkable is separate from slope-derived walkable, so an old slope rejection is not accidentally retained as an unrelated physical blocker. Explicit non-slope blockers remain respected.

The existing terrain-first trail constructor and gentle-approach guard remain at their original **20°** construction constraint, deliberately separate from maximum capability. Raising capability does not rerun it under new rules or redraw a trail. Exact heights, classification/fuel, endpoints/trails, random streams and art placements are preserved. The production navigation module remains at 20°, unchanged. Material blending thresholds are also unchanged; appearance is not a traversal test.

## Important classification limitation

The current procedural studies classify slopes **above 28° as rock**. Gaea classifies slopes **above 20° as rock**. Those classifications are deliberately preserved. Therefore some procedural non-rock grass/channel ground in the 20–28° range becomes physically eligible, but this trial does not open rock at 30–50°. Gaea may show a slope as within the new capability and still correctly draw a red X because its logical cell is rock. Do not infer that yellow must appear across every steep face. Boundary fixtures test clear 35° and exact 50° ground independently of these authored classifications.

Gaea remains an offline exported comparison with no routed trail. Both 129/257 mesh modes retain the same coarse traversal cells/classifications. Picking, object positions, glyphs and selected outlines still sample the displayed mesh; fine mode reports its maximum local fine-face slope separately. Fine detail does not silently change the coarse traversal proxy or grant Path-first access. Any future moving-agent/subcell safety integration remains a separate decision.

## Actual verification

**17/17 focused tests passed sequentially**, including exact 20°/50° and just-below/above boundaries, actual edge/connectivity behavior on steep clear fixtures, forest/rock/explicit blockers, policy separation, no jumping, unchanged production constant, exact gallery terrain/trail/classification preservation and identical sampled art placement. Existing mesh/picking/outline/resource and historical prototype checks passed. Build and diff checks passed. No full simulation suite or benchmark repeated for this isolated trial.

Production browser review reused one tab and the existing server: Rugged/913 and Mixed/34 scan/legend checked; clicked cells on Rugged/913 included **(23,22), grass 14.4°**, gentle/physically walkable; **(13,28), grass 21.6°**, steep/physically walkable; **(9,26), rock 37.5°**, slope-permitted but rock-blocked. These examples are off Path-first, correctly stated separately. Fine Gaea **(88,80)** reported **31.5° coarse / 34.8° fine**, slope-permitted but rock-blocked, with selected outline. Switching back to 129 retained the workflow and clear warning/error logs. No new human checks or acceptance inferred.

## Local review

- Preview: http://127.0.0.1:4178/FireFront/terrain-art.html
- Gaea preview: http://127.0.0.1:4178/FireFront/terrain-art.html?study=gaea
- Development: http://127.0.0.1:5178/FireFront/terrain-art.html

1. Select **Rugged/913**, Close-up, press **T**. Inspect a pale dot and the yellow triangles on the gentler side; the examples above give exact cells to confirm when clicking. Grass (13,28) is steep-permitted but off-policy.
2. Inspect red rock/forest cells. Rock (9,26) remains blocked despite its 37.5° slope being under the capability; terrain above 50° also stays blocked. Check a trail still reports Path-first permission regardless of nearby canopy.
3. In Gaea, compare both mesh modes and click exposed ground. Confirm separate coarse/fine slope reasons and amber footprint alignment after camera movement. Rock classification still blocks the example above.

All slope-trial changes remain uncommitted on codex/terrain-art-prototype. No material/vegetation/terrain/dependency change, normal simulator change, merge/push/deployment or agent behavior expansion.

## User validation and checkpoint

The user reports the requested manual scan checklist is “all good.” No exact cell readings or additional checks are inferred. The slope trial is accepted for this prototype checkpoint; material appearance is not accepted. Future Flexible traversal of fully consumed, burned-and-cooled brush is recorded but not implemented; Path-first remains trail-only.
