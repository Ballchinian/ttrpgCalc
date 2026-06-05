For battleController

*Whats sent to backend*
- activeActor,
- targetCharacters, 
- action: battleData.action.selected,
- avgOrLuck: battleData.settings.avgOrLuck,
- offensiveBonuses,
- characterDefensiveBonuses

WORKFLOW PLAN
1) ActiveActor needs to have the offensive bonsues resolved [in file statResolution] {If self target ignore}
-> targetCharacters need a set defensive bonus assigned, then resolved [in file bonusResolution] {If self target ignore}
2) all effects need to be applied [in file statResolution]
**effects and resolution have to be in the same file from status, item, circumstance effects overlapping**
3) Action time:
->  Determine the kind of train applied, reduce it to singluar effects and send to the relative place
**Will need avgOrLuck for dif calculations**
_Everything_ [done in damageResolusion, split for (spells and actions)/weapons]
Damage
_Unique to weapons_ [done in damageResolusion]
Weapon Traits
_Unique to spells and actions_ [done in conditionResolusion or in healingResolusion]
Conditions (+/-)
Healing
**utility folder for parts of code that are the same**

4) Raw logs should come from action time 

4) LogFormat:
Will need some logs that are the same form 
avgOrLuck === average
- MainLine *The initial success and effect implication* -> {actionMoudle} is a {outcomeText}. {actionModule.text}
- SecondLine *What effects/damage/healing resolved* -> {effect} or "already has"/"doesn't have" {effect}  
**Example** 4d6 damage (to character) or 4d6 healing (to self/to character) or frightened applied (to self/to character)
- activeActor *What skills were involved* -> {check.type}: {playerSkill}
- selectedCharacter *What skills were involved* -> {check.vs}: {foeDefense}

5) Return updated activeCharacter and updatedTargetCharacters for health, logs, effects however keep stats the same

*Files needed*
MAIN FILE -> battleController (where copies are made then sent to resolveActionHelper)
SECONDARY FILE -> resolveActionHelper (Where all the other files are imported)
- BonusResolution 
- effectResolution
- actionResolution
-- damageResolution
-- conditionResolution
-- healingResolution
- logFormat

