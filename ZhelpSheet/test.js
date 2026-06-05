// resolveEffects now returns { result, breakdown } 
// statBonusMap entries gain addSource/subtractSource fields
// After flattening, breakdown = { statName: [{ source, delta }] }
// applyStatChanges attaches character._breakdown = breakdown


// buildTargetList adds:
//   targetDC.breakdown: dcOwner._breakdown?.[dcStat] ?? []
//   rollModifier.breakdown: modOwner._breakdown?.[modStat] ?? []
// Before MAP subtraction, if mapIndex > 0:
//   append { source: "MAP", delta: -(mapIndex * mapPenalty) } to rollModifier.breakdown


// lines changes from string[] to object[]:
// { name, roll?: { left: {label, breakdown}, right: {label, breakdown} }, body }
// Attack: left = "+12 to hit", right = "Goblin — AC: 18"
// Save:   left = "DC: 22",     right = "Goblin — Fortitude: +14"
// Returns { lines, mainLine } (mainLine kept for compat)


// BreakdownValue: wraps label in OverlayTrigger if any breakdown delta < 0
// tooltip text: "frightened: -2, MAP: -5"  
// Each line: row of [left | right] with dotted underline hover, then body text box
