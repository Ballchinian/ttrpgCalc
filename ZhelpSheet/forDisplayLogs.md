After this, in the logs, I will need targetDC (/w name), rollModifier (/w name), diceResult, outcomeKey


If its a spell:
	map through successTableList:
		outcomeKey result*
		find effect object for outcomeKey*
		make list of effectType for each effect*

		check basicSave is true, if so 2* or 1* or 1/2 damage,

		add to effectType*
{
  actionData: {
    basicSaveValues: { basicSave: true, damage: [Object] },
    effects: { critSuccess: [], success: [], failure: [], critFailure: [] },
    _id: '69d3fc3be9de03a7653ef210',
    playerID: '693754859b2ba4a41391f7d0',
    spellName: 'Fireball',
    saveType: 'Reflex',
    targetType: 'aoe',
    actionCost: 2,
    createdAt: '2026-04-06T18:32:27.842Z',
    updatedAt: '2026-04-06T18:33:20.517Z',
    __v: 0
  },
  actionType: 'spell'
}

actionData.effects.outcomeKey.number (if damage), .adjustBy if condition {numRolled, diceRolled, modifier} // {Integer}
actionData.basicSaveValues.damage.number
{numRolled, diceRolled, modifier}

If its a weapon:
	map through successTableList:
		outcomeKey result*

		double if crit, single if norm, anything then void;

		addtoEffectType*
{
  actionData: {
    _id: '69ee67efe9f375bb35c82e94',
    playerID: '693754859b2ba4a41391f7d0',
    weaponName: 'Spear+1 dmg',
    damageType: 'Piercing',
    weaponTraits: [ [Object], [Object], [Object] ],
    numRolled: 1,
    diceRolled: 6,
    modifier: 1,
    createdAt: '2026-04-26T19:30:55.925Z',
    updatedAt: '2026-04-26T19:30:55.925Z',
    __v: 0
  },
  actionType: 'weapon'
}

actionData.numRolled, diceRolled, modifier
(In the future, introduce weaponTraits through varables put into damage or other ways)

If its a condition:
	map through successTableList:
		outcomeKey result*
		find effect object for outcomekey*
		make list of effectType for eachg effect*
        add to effectType*
{
  name: 'Grapple',
  type: 'attack',
  targetType: 'single',
  check: { rollModifier: 'athletics', targetDC: 'fortitude' },
  effects: {
    criticalSuccess: {
      text: 'Your target is restrained until the end of your next turn unless you move or your target Escapes.',
      effects: [Array]
    },
    success: {
      text: 'Your target is grabbed until the end of your next turn unless you move or your target Escapes.',
      effects: [Array]
    },
    failure: {
      text: 'You fail to grab your target. If you already had them grabbed or restrained, those conditions end.',
      effects: [Array]
    },
    criticalFailure: {
      text: 'You lose your grip; if they were grabbed, they break free and can grab you or knock you prone.',
      effects: [Array]
    }
  },
  description: "You attempt to grab a creature or object with your free hand. Attempt an Athletics check against the target's Fortitude DC. You can Grapple a target you already have grabbed or restrained without having a hand free."
}

actionModules[actionData].effects.outcomeKey.effects
if condition
{type:con..., name:"condition"} 
if damage
{type:damage, number:1d6}, need unpacker
