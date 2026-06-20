# Pathfinder 2e Combat Calculator

A full stack Pathfinder Second Edition combat toolkit. Build characters and their weapons and spells, assemble two parties, then run an encounter turn by turn through a rules-accurate resolution engine that handles damage, conditions, saves, item runes, and class features with a combat log and round-by-round recap.

## Features

* Character builder (HP, AC, saves, skills, resistances, weaknesses, immunities, class options, portrait upload)
* Weapon and spell action builder (traits, runes, critical specialization, versatile damage, saving throws, healing, conditions)
* Character import from Pathbuilder 2e (by export code or pasted JSON) and Foundry VTT
* Turn-based battle simulator with two parties, an initiative tracker, action economy, and multiple attack penalty
* Three resolution modes: Average, Luck, and Choose
* PF2e rules engine: resistance / weakness / immunity, condition hierarchy, basic saves, persistent damage, off-guard, temporary HP
* Class features and stances (Rage, Panache and Finishers, Sneak Attack, Hunt Prey, and more)
* Combat log, round-by-round recap, and expiring-condition tracking
* Saved battles (up to five per account)
* Account system with secure session handling and email password reset

## Documentation

* [API Endpoints](./ENDPOINTS.md)

---

# How the Resolution Engine Works

The server is authoritative. The frontend never resolves an action itself, it sends the actor, targets, and chosen action to the backend, which refetches the action from the database (so a client can't inject arbitrary effects), applies bonuses and conditions, rolls or averages the dice, then returns the updated combatants, a formatted log, and per-target statistics.

Every action runs through the same pipeline:

1. Apply offensive bonuses to the actor and defensive bonuses to each target.
2. Format the action into per-target effects (damage, healing, conditions, temp HP).
3. Resolve each effect, applying the target's resistances, weaknesses, and immunities.
4. Apply class-feature riders (precision damage, stance bonuses) and critical specialization.
5. Build the log and stats, and return the mutated combatants.

### Resolution Modes

| Mode    | Behaviour                                                                  |
| ------- | -------------------------------------------------------------------------- |
| Average | Deterministic expected values - the fastest way to compare options.        |
| Luck    | Rolls real dice, including per-die results for the hover breakdown.         |
| Choose  | You pick the outcome (critical success / success / failure / critical failure) for each target, and the pre-computed effects for that outcome are applied. |

### Damage Modifiers

Damage modifiers follow the PF2e order: weakness is added, resistance is subtracted, and the total is clamped at zero. Immunity zeroes the damage and overrides both. Type matching is case-insensitive.

---

# Conditions & Durations

Conditions are stored on each combatant with a value (where applicable) and a duration that decides when they expire. The engine enforces the PF2e condition hierarchy, a more severe condition removes and suppresses the ones it covers (for example, **restrained** removes **grabbed** and **immobilized**, and readding the lesser condition is ignored while the greater one is present).

| Duration Type      | Expires                                                        |
| ------------------ | ------------------------------------------------------------- |
| `manual`           | Never automatically, removed by hand                         |
| `decrement`        | Value drops by one at end of turn; cleared at zero            |
| `rounds`           | After a set number of rounds                                  |
| `endOfRound`       | At the end of the current round                               |
| `endOfNextTurn`    | At the end of the applying actor's next turn                  |
| `startOfTargetTurn`| At the start of the afflicted creature's turn                 |
| `flatCheck`        | When a recovery flat check succeeds                           |

**Off-guard** is tracked by source: it persists as long as any condition that grants it (prone, grabbed, restrained, and so on) is still present, and clears once the last source is gone.

**Persistent damage** is applied at the end of each round, adjusted for resistance and weakness, followed by a recovery flat check (default DC 15). The same damage type does not stack, the higher value is kept.

---

# Runes & Item Bonuses

Weapon and armour runes are stored on the item and folded into the relevant rolls during resolution, so their contribution stays visible rather than being baked into a single number.

| Rune       | Effect                                                          |
| ---------- | -------------------------------------------------------------- |
| Potency    | Item bonus to attack rolls (rank 0-3)                          |
| Striking   | Adds extra weapon damage dice (striking / greater / major)     |
| Resilient  | Item bonus to saving throws (rank 0-3), folded in during battle |

---

# Class Features

A character can take one class option, which grants extra actions, stances, or conditional Strike damage. Features are declarative data, so the resolver and UI both read from one registry.

| Class         | Feature                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| Swashbuckler  | Panache, Precise Strike, and Finishers (Rascal, Braggart, Gymnast, Fencer, Battledancer, and Wit styles) |
| Barbarian     | Rage - temporary HP plus extra melee and unarmed Strike damage          |
| Rogue         | Sneak Attack - precision dice against an off-guard target               |
| Ranger        | Hunt Prey and the Precision hunter's edge                               |
| Investigator  | Devise a Stratagem - precision dice on your next Strike                  |
| Thaumaturge   | Exploit Vulnerability                                                    |
| Inventor      | Overdrive                                                                |
| Magus         | Arcane Cascade stance                                                    |
| Bard          | Courageous Anthem - inspired courage for allies                         |

Global actions available to everyone include Grapple, Trip, Demoralize, Stand, and Escape.

---

# Authentication

Accounts use short lived access tokens with rotating refresh tokens.

* Passwords are hashed with bcrypt.
* The access token is a JWT held in memory and expires after 15 minutes.
* A refresh token is stored in an httpOnly cookie (7 day lifetime) and rotated on every refresh; only a hash of it is kept in the database, so a database leak cannot be used to hijack sessions.
* Password reset is delivered by email with a single use, time limited token; completing a reset invalidates all active sessions.
* Authentication and import routes are rate limited.

---

# Battle Lifecycle

## Setup

Characters are added to a battle as **heroes** or **foes**. Duplicate names are disambiguated automatically. The battle (parties, round, initiative, and settings) persists locally and is scoped to the logged in user.

## Initiative

Initiative can be rolled by Perception, rolled with a d20, or arranged manually with drag to reorder. Ties break on the higher Perception, then a coin flip.

## Turns

On a turn you pick an actor, an action, and its targets, then resolve. Action economy and the multiple attack penalty are tracked automatically (and can be toggled off). Running an actor out of actions advances initiative to the next combatant.

## End of Round

Ending the round ticks every duration, applies persistent damage and its recovery flat checks, clears spent conditions, and refreshes everyone's actions. Start of turn action loss from slowed and stunned is applied here as well.

## Recap

Every resolved action is recorded in a round by round recap with damage dealt, healing, and condition changes. Battles can be saved (up to five) and reloaded later.

---

# Typical Flow

1. Build or import your characters.
2. Create their weapons and spells in the Action Builder.
3. Add characters to a battle as heroes and foes.
4. Roll initiative.
5. On each turn, select an actor, an action, and the targets.
6. Resolve: the engine applies damage, conditions, and class-feature effects.
7. End the round to tick durations and resolve persistent damage.
8. Review the recap, and save the battle to revisit it later.

---

# Tech Stack

* **Frontend:** React 19, Vite, Zustand, React Router, Bootstrap
* **Backend:** Node.js, Express, MongoDB (Mongoose), JSON Web Tokens, Cloudinary
* **Testing:** Node's built-in test runner (backend), Vitest (frontend)

---

# Running Locally

The frontend and backend are independent packages, each with its own `.env` (see the `.env.example` in each directory).

```sh
# Backend (http://localhost:5000)
cd backend
npm install
npm run dev

# Frontend (http://localhost:3000)
cd frontend
npm install
npm start
```

Run the test suites with `npm test` in either directory.
