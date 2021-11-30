import { t } from '@lingui/macro';
import { formatNumber } from 'common/format';
import SPELLS from 'common/SPELLS';
import { SpellLink } from 'interface';
import { SpellIcon } from 'interface';
import Analyzer, { Options, SELECTED_PLAYER } from 'parser/core/Analyzer';
import Events, {
  ApplyBuffEvent,
  CastEvent,
  HealEvent,
  RefreshBuffEvent,
  EndChannelEvent,
} from 'parser/core/Events';
import { ThresholdStyle, When } from 'parser/core/ParseResults';
import Haste from 'parser/shared/modules/Haste';
import BoringValueText from 'parser/ui/BoringValueText';
import Statistic from 'parser/ui/Statistic';
import STATISTIC_CATEGORY from 'parser/ui/STATISTIC_CATEGORY';
import { STATISTIC_ORDER } from 'parser/ui/StatisticBox';
import React from 'react';

class EssenceFont extends Analyzer {
  static dependencies = {
    haste: Haste,
  };
  totalHealing: number = 0;
  totalOverhealing: number = 0;
  totalAbsorbs: number = 0;
  castEF: number = 0;
  targetsEF: number = 0;
  efHotHeal: number = 0;
  efHotOverheal: number = 0;
  targetOverlap: number = 0;
  uniqueTargets: Set<number> = new Set<number>();
  total: number = 0;
  expected_duration: number = 0;
  cancelled_ef: number = 0;
  hasUpwelling: boolean = false;
  cancelDelta: number = 100;
  last_ef_time: number = 0;
  last_ef: any = null;
  protected haste!: Haste;
  constructor(options: Options) {
    super(options);
    this.addEventListener(
      Events.cast.by(SELECTED_PLAYER).spell(SPELLS.ESSENCE_FONT),
      this.castEssenceFont,
    );
    this.addEventListener(
      Events.heal.by(SELECTED_PLAYER).spell(SPELLS.ESSENCE_FONT),
      this.handleEssenceFont,
    );
    this.addEventListener(
      Events.heal.by(SELECTED_PLAYER).spell(SPELLS.ESSENCE_FONT_BUFF),
      this.handleEssenceFontBuff,
    );
    this.addEventListener(
      Events.applybuff.by(SELECTED_PLAYER).spell(SPELLS.ESSENCE_FONT_BUFF),
      this.applyEssenceFontBuff,
    );
    this.addEventListener(
      Events.refreshbuff.by(SELECTED_PLAYER).spell(SPELLS.ESSENCE_FONT_BUFF),
      this.refreshEssenceFontBuff,
    );
    this.addEventListener(
      Events.EndChannel.by(SELECTED_PLAYER).spell(SPELLS.ESSENCE_FONT),
      this.handleEndChannel,
    );
    this.hasUpwelling = this.selectedCombatant.hasTalent(SPELLS.UPWELLING_TALENT.id);
    this.last_ef = null;
  }

  get efHotHealing() {
    return this.efHotHeal;
  }

  get efHotOverhealing() {
    return (this.efHotOverheal / (this.efHotHeal + this.efHotOverheal)).toFixed(4);
  }

  get avgTargetsHitPerEF() {
    return this.targetsEF / this.castEF || 0;
  }

  get efHotOverlap() {
    return (this.targetOverlap / this.targetsEF || 0).toFixed(2);
  }

  get suggestionThresholds() {
    return {
      actual: this.avgTargetsHitPerEF,
      isLessThan: {
        minor: 17,
        average: 14,
        major: 12,
      },
      style: ThresholdStyle.NUMBER,
    };
  }

  get suggestionThresholdsCancel() {
    return {
      actual: this.cancelled_ef,
      isGreaterThanOrEqual: {
        major: 1,
      },
      style: ThresholdStyle.NUMBER,
    };
  }

  castEssenceFont(event: CastEvent) {
    let extra_secs = 0;
    if (this.hasUpwelling) {
      extra_secs = Math.min(
        (event.timestamp - (this.last_ef + 12000)) / 6000, //12000 is the cooldown of EF in MS and 6000 corresponds to the number of MS for UW to get a full second in channels
        3,
      );
    }
    this.expected_duration = (3000 + extra_secs * 1000) / (1 + this.haste.current);
    this.last_ef_time = event.timestamp;
    this.last_ef = event;
    this.castEF += 1;
    this.total += this.uniqueTargets.size || 0;
    this.uniqueTargets.clear();
  }

  handleEssenceFont(event: HealEvent) {
    this.totalHealing += event.amount || 0;
    this.totalOverhealing += event.overheal || 0;
    this.totalAbsorbs += event.absorbed || 0;
  }

  handleEssenceFontBuff(event: HealEvent) {
    if (event.tick === true) {
      this.efHotHeal += (event.amount || 0) + (event.absorbed || 0);
      this.efHotOverheal += event.overheal || 0;
    }

    this.totalHealing += event.amount || 0;
    this.totalOverhealing += event.overheal || 0;
    this.totalAbsorbs += event.absorbed || 0;
    this.uniqueTargets.add(event.targetID);
  }

  applyEssenceFontBuff(event: ApplyBuffEvent) {
    this.targetsEF += 1;
  }

  refreshEssenceFontBuff(event: RefreshBuffEvent) {
    this.targetsEF += 1;
    this.targetOverlap += 1;
  }

  handleEndChannel(event: EndChannelEvent) {
    if (event.duration < this.expected_duration - this.cancelDelta) {
      this.cancelled_ef += 1;
      this.last_ef.meta = this.last_ef.meta || {};
      this.last_ef.meta.isInefficientCast = true;
      this.last_ef.meta.inefficientCastReason = `This Essence Font cast was canceled early.`;
    }
  }

  suggestions(when: When) {
    when(this.suggestionThresholds).addSuggestion((suggest, actual, recommended) =>
      suggest(
        <>
          You are currently using not utilizing your <SpellLink id={SPELLS.ESSENCE_FONT.id} />{' '}
          effectively. Each <SpellLink id={SPELLS.ESSENCE_FONT.id} /> cast should hit a total of 18
          targets. Either hold the cast til 6 or more targets are injured or move while casting to
          increase the effective range of the spell.
        </>,
      )
        .icon(SPELLS.ESSENCE_FONT.icon)
        .actual(
          `${this.avgTargetsHitPerEF.toFixed(2)}${t({
            id: 'monk.mistweaver.suggestions.essenceFont.averageTargetsHit',
            message: `average targets hit per cast`,
          })}`,
        )
        .recommended(`${recommended} targets hit is recommended`),
    );
    when(this.suggestionThresholdsCancel).addSuggestion((suggest, actual, recommended) =>
      suggest(<>You cancelled Essence Font</>)
        .icon(SPELLS.ESSENCE_FONT.icon)
        .actual(
          `${this.cancelled_ef} ${t({
            id: 'monk.mistweaver.suggestions.essenceFont.cancelledCasts',
            message: ` cancelled casts`,
          })}`,
        )
        .recommended(`0 cancelled casts is recommended`),
    );
  }

  statistic() {
    const averageHits = this.total / this.castEF;
    return (
      <Statistic
        position={STATISTIC_ORDER.OPTIONAL(0)}
        size="flexible"
        category={STATISTIC_CATEGORY.THEORYCRAFT}
        tooltip={<>This is the average unique targets hit per essences font cast.</>}
      >
        <BoringValueText
          label={
            <>
              <SpellIcon id={SPELLS.ESSENCE_FONT.id} /> Average Unique Targets Hit
            </>
          }
        >
          {formatNumber(averageHits)}
        </BoringValueText>
      </Statistic>
    );
  }
}

export default EssenceFont;
