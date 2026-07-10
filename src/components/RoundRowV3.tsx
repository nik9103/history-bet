import { useState } from 'react';
import type { RoundItem as RoundItemType } from '../data/historyData';
import { AmountDisplay } from './AmountDisplay';
import { TimelineMarker } from './TimelineMarker';
import { MarketIcon } from './icons/MarketIcon';
import { ChevronRightIcon } from './icons/Icons';
import styles from './RoundRowV3.module.css';

type RoundRowV3Props = {
  round: RoundItemType;
  hideTopLine: boolean;
  hideBottomLine: boolean;
  onSelect: () => void;
};

export function RoundRowV3({
  round,
  hideTopLine,
  hideBottomLine,
  onSelect,
}: RoundRowV3Props) {
  const [hovered, setHovered] = useState(false);
  const hasBets = Boolean(round.bets?.length);
  const isSelectable = !round.loading && !round.waiting && hasBets;

  return (
    <button
      type="button"
      className={`${styles.row} ${hovered && isSelectable ? styles.rowHovered : ''}`}
      data-round-id={round.id}
      onClick={isSelectable ? onSelect : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={!isSelectable}
    >
      <TimelineMarker
        number={round.number}
        hideTopLine={hideTopLine}
        hideBottomLine={hideBottomLine}
      />
      <div className={styles.body}>
        <div className={styles.left}>
          <span className={styles.iconWrap}>
            <MarketIcon loading={round.loading} />
          </span>
          <div className={styles.info}>
            <span className={styles.title}>{round.title}</span>
            <span className={styles.meta}>
              {round.time}
              {round.dealer && (
                <>
                  <span className={styles.dot}> · </span>
                  {round.dealer}
                </>
              )}
            </span>
          </div>
        </div>
        <div className={styles.right}>
          {round.amount && (
            <AmountDisplay
              amount={round.amount}
              subtitle={round.subtitle}
              positive={round.amountPositive}
            />
          )}
          {hasBets && (
            <span className={styles.chevron} aria-hidden="true">
              <ChevronRightIcon />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
