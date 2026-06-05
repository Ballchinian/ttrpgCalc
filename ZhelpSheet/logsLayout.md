We have 4 boxes of info, first are the stats for the activeActor, and the selectedDefenders

?damage here is a popout with:
    `3d6 + 1: {4} {5} {2} + 1 = 12`
Next the big boxes:
    if it was a weapon:
    {name}: Roll was a {outcome}. Rolled {roll}. Damage: {damage} 
    {name}: Roll was a {Crit success}. Rolled {roll}. Damage: *25!*
    {name}: Roll was a failure. Rolled {roll}. Damage: Missed

    if it was a spell /w condition:
    {name}: Roll was a {outcome}. Rolled {roll}. Condition: applied/removed {condition}
    {name}: ROll was a failure. Rolled {roll}. Condition: fizzles
    {name}: Roll was a success. Rolled {roll}. Condition: applied {condition}
    {name}: Roll was a success. Rolled {roll}. Condition: removed {condition} 

    if spells with multiple effects:
    {name}: Roll was a {outcome}. Rolled {roll}. Condition: applies {condition}, removes {condition}. Damage: {damage}, {damage}. Heal: {heal}.
    (pairs effects)

    if it was an automatic condition/heal:
    {Name}: Condition: applied/removed {condition}

?Chance here is a popout with all chances for all options in format:
    Crit Success: x
    Success: y
    Failure: z
    Crit Failure: L
?Damage is how it is calculated:
    `3d6+1: numRolled * (diceRolled + 1 / 2) + 2 =  11.5`
What happens when we go with avg Roll:
    if it was a weapon:
    {name}: `Roll table: {change}`. Damage: {damage} `on average`

    if it was a spell:
    {name}: `Roll table: {change}. Effects: {conditions}`
    *option to click condition to add it*

what happesn when its automatic conditioon:
    {name}: applies/removes {condition}