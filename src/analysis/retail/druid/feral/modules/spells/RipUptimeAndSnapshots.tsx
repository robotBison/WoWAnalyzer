import SPELLS from 'common/SPELLS';
import { Options } from 'parser/core/Analyzer';
import { ApplyDebuffEvent, RefreshDebuffEvent } from 'parser/core/Events';
import Enemies from 'parser/shared/modules/Enemies';
import uptimeBarSubStatistic, { SubPercentageStyle } from 'parser/ui/UptimeBarSubStatistic';

import {
  getPrimalWrathDuration,
  getRipDuration,
  getRipFullDuration,
  MAX_CPS,
  RIP_DURATION_BASE,
  SNAPSHOT_DOWNGRADE_BUFFER,
} from 'analysis/retail/druid/feral/constants';
import {
  getHardcast,
  getPrimalWrath,
} from 'analysis/retail/druid/feral/normalizers/CastLinkNormalizer';
import Snapshots, {
  BLOODTALONS_SPEC,
  hasSpec,
  SnapshotSpec,
  TIGERS_FURY_SPEC,
} from 'analysis/retail/druid/feral/modules/core/Snapshots';
import { TALENTS_DRUID } from 'common/TALENTS';
import getResourceSpent from 'parser/core/getResourceSpent';
import RESOURCE_TYPES from 'game/RESOURCE_TYPES';
import { QualitativePerformance } from 'parser/ui/QualitativePerformance';
import { SpellLink } from 'interface';
import { PerformanceBoxRow } from 'interface/guide/components/PerformanceBoxRow';
import { RoundedPanel } from 'interface/guide/components/GuideDivs';
import { explanationAndDataSubsection } from 'interface/guide/components/ExplanationRow';

class RipUptimeAndSnapshots extends Snapshots {
  static dependencies = {
    ...Snapshots.dependencies,
    enemies: Enemies,
  };

  protected enemies!: Enemies;

  castLog: RipCast[] = [];

  constructor(options: Options) {
    super(SPELLS.RIP, SPELLS.RIP, [TIGERS_FURY_SPEC, BLOODTALONS_SPEC], options);
  }

  getDotExpectedDuration(event: ApplyDebuffEvent | RefreshDebuffEvent): number {
    const fromHardcast = getHardcast(event);
    if (fromHardcast) {
      return getRipDuration(fromHardcast, this.selectedCombatant);
    }
    const fromPrimalWrath = getPrimalWrath(event);
    if (fromPrimalWrath) {
      return getPrimalWrathDuration(fromPrimalWrath, this.selectedCombatant);
    }

    console.warn(
      "Couldn't find what cast produced Rip application - assuming base duration",
      event,
    );
    return RIP_DURATION_BASE;
  }

  getDotFullDuration(): number {
    return getRipFullDuration(this.selectedCombatant);
  }

  getTotalDotUptime(): number {
    return this.enemies.getBuffUptime(SPELLS.RIP.id);
  }

  handleApplication(
    application: ApplyDebuffEvent | RefreshDebuffEvent,
    snapshots: SnapshotSpec[],
    prevSnapshots: SnapshotSpec[] | null,
    power: number,
    prevPower: number,
    remainingOnPrev: number,
    clipped: number,
  ) {
    const ripCast = getHardcast(application);
    const pwCast = getPrimalWrath(application);
    if (ripCast) {
      // log the cast
      const timestamp = ripCast.timestamp;
      const targetName = this.enemies.getEntity(ripCast)?.name;
      const cpsUsed = getResourceSpent(ripCast, RESOURCE_TYPES.COMBO_POINTS);
      const wasNewApplication = prevSnapshots === null;
      const wasUnacceptableDowngrade =
        prevPower > power && remainingOnPrev > SNAPSHOT_DOWNGRADE_BUFFER;
      const wasUpgrade = prevPower < power;

      this.castLog.push({
        timestamp,
        targetName,
        cpsUsed,
        remainingOnPrev,
        clipped,
        snapshots,
        wasNewApplication,
        wasUnacceptableDowngrade,
        wasUpgrade,
      });
    } else if (pwCast) {
      // TODO handle PW cast
    } else {
      console.warn("Couldn't find cast linked to Rip application", application);
    }

    if (prevPower >= power && clipped > 0) {
      const cast = getHardcast(application);
      if (cast) {
        cast.meta = {
          isInefficientCast: true,
          inefficientCastReason: `This cast clipped ${(clipped / 1000).toFixed(
            1,
          )} seconds of Rip time without upgrading the snapshot.
          Try to wait until the last 30% of Rip's duration before refreshing`,
        };
      }
    }
  }

  /** Subsection explaining the use of Rip and providing performance statistics */
  get guideSubsection(): JSX.Element {
    const hasPw = this.selectedCombatant.hasTalent(TALENTS_DRUID.PRIMAL_WRATH_TALENT);
    const hasBt = this.selectedCombatant.hasTalent(TALENTS_DRUID.BLOODTALONS_TALENT);
    const castPerfBoxes = this.castLog.map((cast, index) => {
      /** Perf logic:
       *  < 5 CPs (and not initial cast) -> Red
       *  Missing BT -> Red
       *  Missing TF -> Yellow
       *  Clip Duration (but upgrade Snapshot) -> Yellow
       *  Clip Duration -> Red
       *  None of the Above -> Green
       */
      let value: QualitativePerformance = 'good';
      if (cast.cpsUsed < MAX_CPS && index !== 0) {
        value = 'fail';
      } else if (hasBt && !hasSpec(cast.snapshots, BLOODTALONS_SPEC)) {
        value = 'fail';
      } else if (cast.clipped > 0) {
        value = cast.wasUpgrade ? 'ok' : 'fail';
      } else if (!hasSpec(cast.snapshots, TIGERS_FURY_SPEC)) {
        value = 'ok';
      }
      // TODO require TF / BT

      const tooltip = (
        <>
          @ <strong>{this.owner.formatTimestamp(cast.timestamp)}</strong> targetting{' '}
          <strong>{cast.targetName || 'unknown'}</strong> using <strong>{cast.cpsUsed} CPs</strong>
          <br />
          {!cast.wasNewApplication && (
            <>
              Refreshed on target w/ {(cast.remainingOnPrev / 1000).toFixed(1)}s remaining{' '}
              {cast.clipped > 0 && (
                <>
                  <strong>- Clipped {(cast.clipped / 1000).toFixed(1)}s!</strong>
                </>
              )}
              <br />
            </>
          )}
          Snapshots: <strong>{cast.snapshots.map((ss) => ss.name).join(', ')}</strong>
          <br />
        </>
      );
      return { value, tooltip };
    });

    const explanation = (
      <p>
        <b>
          <SpellLink id={SPELLS.RIP.id} />
        </b>{' '}
        is your highest damage-per-energy single target spender. Try to maintain 100% uptime.{' '}
        {hasPw ? (
          <>
            Use <SpellLink id={TALENTS_DRUID.PRIMAL_WRATH_TALENT.id} /> to apply it when you can hit
            more than one target.
          </>
        ) : (
          <>
            You can even keep it active on multiple targets, though if a fight will frequently have
            multiple targets consider speccing for{' '}
            <SpellLink id={TALENTS_DRUID.PRIMAL_WRATH_TALENT.id} />.
          </>
        )}{' '}
        Don't refresh early, and try to always snapshot <SpellLink id={SPELLS.TIGERS_FURY.id} />
        {hasBt && (
          <>
            {' '}
            and <SpellLink id={TALENTS_DRUID.BLOODTALONS_TALENT.id} />
          </>
        )}
        .
      </p>
    );

    const data = (
      <div>
        <RoundedPanel>
          <div>
            <strong>Rip uptime / snapshots</strong>
            <small> - Try to get as close to 100% as the encounter allows!</small>
          </div>
          {this.subStatistic()}
        </RoundedPanel>
        <strong>Rip casts</strong>
        <small>
          {' '}
          - Green is a good cast, Yellow is an ok cast (clipped duration but upgraded snapshot or
          missing Tigers Fury), Red is a bad cast (clipped duration
          {hasBt && ' or missing Bloodtalons'}). Mouseover for more details.
        </small>
        <PerformanceBoxRow values={castPerfBoxes} />
      </div>
    );

    return explanationAndDataSubsection(explanation, data);
  }

  get uptimeHistory() {
    return this.enemies.getDebuffHistory(SPELLS.RIP.id);
  }

  subStatistic() {
    return uptimeBarSubStatistic(
      this.owner.fight,
      {
        spells: [SPELLS.RIP],
        uptimes: this.uptimeHistory,
      },
      this.snapshotUptimes,
      SubPercentageStyle.RELATIVE,
    );
  }
}

/** Tracking object for each Rip cast */
type RipCast = {
  /** Cast's timestamp */
  timestamp: number;
  /** Name of cast's target */
  targetName?: string;
  /** Number of Combo Points consumed */
  cpsUsed: number;
  /** Time remaining on previous Rip */
  remainingOnPrev: number;
  /** Time clipped from previous Rip */
  clipped: number;
  /** Snapshots on new cast */
  snapshots: SnapshotSpec[];
  /** True iff this was a new application */
  wasNewApplication: boolean;
  /** True iff snapshots were downgraded with more than buffer time remaining */
  wasUnacceptableDowngrade: boolean;
  /** True iff the snapshot got stronger */
  wasUpgrade: boolean;
};

export default RipUptimeAndSnapshots;