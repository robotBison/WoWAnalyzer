import BLOODLUST_BUFFS from 'game/BLOODLUST_BUFFS';
import CoreBuffs from 'parser/core/modules/Buffs';

import * as SPELLS from '../SPELLS';

class Buffs extends CoreBuffs {
  buffs() {
    return [
      {
        spellId: SPELLS.BEAST_WITHIN_BUFF,
        timelineHighlight: true,
        triggeredBySpellId: SPELLS.BESTIAL_WRATH,
      },
      {
        spellId: SPELLS.RAPID_FIRE,
        timelineHighlight: true,
        triggeredBySpellId: SPELLS.RAPID_FIRE,
      },
      {
        spellId: SPELLS.MISDIRECTION,
        timelineHighlight: true,
        triggeredBySpellId: SPELLS.MISDIRECTION,
      },
      {
        spellId: Object.keys(BLOODLUST_BUFFS).map((item) => Number(item)),
        timelineHighlight: true,
      },
    ];
  }
}

export default Buffs;
