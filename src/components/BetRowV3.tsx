import { useState } from 'react';
import type { BetItem } from '../data/historyData';
import { getBetReceiptSections } from '../data/historyData';
import { AmountDisplay } from './AmountDisplay';
import { BetIcon } from './icons/DiceIcon';
import { ChevronIcon } from './icons/Icons';
import styles from './BetRowV3.module.css';

type BetRowV3Props = {
  bet: BetItem;
  expanded: boolean;
  onToggleExpand: () => void;
};

export function BetRowV3({ bet, expanded, onToggleExpand }: BetRowV3Props) {
  const [hovered, setHovered] = useState(false);
  const positive = bet.amount.startsWith('+');
  const sections = getBetReceiptSections(bet);

  return (
    <div className={styles.wrap} data-bet-id={bet.id}>
      <button
        type="button"
        className={`${styles.header} ${hovered && !expanded ? styles.headerHovered : ''}`}
        onClick={onToggleExpand}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className={styles.left}>
          <BetIcon type={bet.icon} />
          <div className={styles.info}>
            <span className={styles.title}>{bet.title}</span>
            <span className={styles.meta}>
              {bet.multiplier}
              <span className={styles.dot}> · </span>
              {bet.result === 'guess' ? ' Guess' : ' Loss'}
            </span>
          </div>
        </div>
        <div className={styles.right}>
          <AmountDisplay amount={bet.amount} subtitle={bet.stake} positive={positive} />
          <span className={`${styles.chevronBtn} ${expanded ? styles.chevronUp : ''}`}>
            <ChevronIcon direction="down" />
          </span>
        </div>
      </button>

      <div className={`${styles.detailsWrap} ${expanded ? styles.detailsOpen : ''}`}>
        <div className={styles.detailsInner}>
          <div className={styles.details}>
            <div className={styles.sections}>
              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className={styles.section}>
                  <div className={styles.divider} />
                  {section.map((row) => (
                    <div key={row.label} className={styles.row}>
                      <span>{row.label}</span>
                      <span>{row.value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
