import rage from "./rage.js";
import dirtyTrick from "./dirtyTrick.js";
import tumbleThrough from "./tumbleThrough.js";
import shove from "./shove.js";
import feint from "./feint.js";
import createADiversion from "./createADiversion.js";
import bonMot from "./bonMot.js";
import perform from "./perform.js";
import exploitVulnerability from "./exploitVulnerability.js";
import huntPrey from "./huntPrey.js";
import deviseAStratagem from "./deviseAStratagem.js";
import overdrive from "./overdrive.js";
import arcaneCascade from "./arcaneCascade.js";
import courageousAnthem from "./courageousAnthem.js";

//Actions granted by a class feature/style (not available to everyone). Keyed by display name, same
//shape as the global actionModules. A character can only use one of these if their classOption's
//feature/style grants it (validated in battleController via getFeatureActions). Config-driven values
//(e.g. Rage's damage / temp HP) use "$key" tokens resolved from classOption.config by hydrateFeatureAction.
export const featureActions = {
    Rage: rage,
    "Dirty Trick": dirtyTrick,
    "Tumble Through": tumbleThrough,
    Shove: shove,
    Feint: feint,
    "Create a Diversion": createADiversion,
    "Bon Mot": bonMot,
    Perform: perform,
    "Exploit Vulnerability": exploitVulnerability,
    "Hunt Prey": huntPrey,
    "Devise a Stratagem": deviseAStratagem,
    Overdrive: overdrive,
    "Arcane Cascade": arcaneCascade,
    "Courageous Anthem": courageousAnthem,
};
