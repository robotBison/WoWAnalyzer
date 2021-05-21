import React from 'react';

import './UptimeBar.scss';

export type Uptime = {
  start: number;
  end: number;
};

type Props = {
  uptimeHistory: Uptime[];
  start: number;
  end: number;
  barColor?: string;
};

const UptimeBar = ({ uptimeHistory, start: fightStart, end: fightEnd, barColor, ...others }: Props) => {
  const fightDuration = fightEnd - fightStart;

  return (
    <div className="uptime-bar" {...others}>
      {uptimeHistory.map((buff) => {
        const start = buff.start;
        const end = buff.end !== null ? buff.end : fightEnd;

        return (
          <div
            key={`${start}-${end}`}
            style={{
              left: `${((start - fightStart) / fightDuration) * 100}%`,
              width: `${((end - start) / fightDuration) * 100}%`,
              background: `${barColor}`
            }}
          />
        );
      })}
    </div>
  );
};

export default UptimeBar;
