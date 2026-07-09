import { useState } from 'react';
import type { MatchItem } from '../data/historyData';
import { ActiveBadge } from './ActiveBadge';
import { AmountDisplay } from './AmountDisplay';
import { ChevronRightIcon } from './icons/Icons';
import styles from './MatchRowV2.module.css';

type MatchRowV2Props = {
  match: MatchItem;
  onSelect: () => void;
};

export function MatchRowV2({ match, onSelect }: MatchRowV2Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      className={`${styles.row} ${hovered ? styles.rowHovered : ''}`}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.titleRow}>
            <span className={styles.title}>{match.title}</span>
            {match.active && <ActiveBadge />}
          </div>
          <span className={styles.meta}>
            {match.date}
            <span className={styles.dot}> · </span>
            ID:{match.matchId}
          </span>
        </div>
        <div className={styles.right}>
          {match.summary && (
            <AmountDisplay
              amount={match.summary.amount}
              subtitle={match.summary.subtitle}
              positive={match.summary.amountPositive}
              amountSize="caption"
            />
          )}
          <span className={styles.chevron} aria-hidden="true">
            <ChevronRightIcon />
          </span>
        </div>
      </div>
    </button>
  );
}
