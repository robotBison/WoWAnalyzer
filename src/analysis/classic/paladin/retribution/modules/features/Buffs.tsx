import CoreAuras from 'parser/core/modules/Auras';
import SPELLS from 'common/SPELLS/classic/paladin';
import BLOODLUST_BUFFS from 'game/BLOODLUST_BUFFS';
import ITEM_BUFFS from 'game/classic/ITEM_BUFFS';

class Buffs extends CoreAuras {
  // A list of Buffs (on the current player) to highlight on the Timeline
  auras() {
    return [
      {
        spellId: SPELLS.SEAL_OF_CORRUPTION.id,
        timelineHighlight: true,
      },
      {
        spellId: SPELLS.SEAL_OF_JUSTICE.id,
        timelineHighlight: true,
      },
      {
        spellId: SPELLS.SEAL_OF_INSIGHT.id,
        timelineHighlight: true,
      },
      {
        spellId: SPELLS.SEAL_OF_RIGHTEOUSNESS.id,
        timelineHighlight: true,
      },
      {
        spellId: SPELLS.SEAL_OF_TRUTH.id,
        timelineHighlight: true,
      },
      // Do not adjust the lines below
      {
        spellId: Object.keys(BLOODLUST_BUFFS).map((item) => Number(item)),
        timelineHighlight: true,
      },
      {
        spellId: Object.keys(ITEM_BUFFS).map((item) => Number(item)),
        timelineHighlight: true,
      },
    ];
  }
}

export default Buffs;
