import type { BetItem } from '../data/historyData';
import { BetIcon } from './icons/DiceIcon';
import { AmountDisplay } from './AmountDisplay';
import styles from './BetRow.module.css';

type BetRowProps = {
  bet: BetItem;
  hovered?: boolean;
  amountSize?: 'caption' | 'body';
};

export function BetRow({ bet, hovered = false, amountSize }: BetRowProps) {
  const positive = bet.amount.startsWith('+');

  return (
    <div className={`${styles.row} ${hovered ? styles.hovered : ''}`}>
      <BetIcon type={bet.icon} />
      <div className={styles.content}>
        <div className={styles.main}>
          <span className={styles.title}>{bet.title}</span>
          <span className={styles.meta}>
            {bet.multiplier}
            <span className={styles.dot}> · </span>
            {bet.result === 'guess' ? ' Guess' : ' Loos'}
          </span>
        </div>
        <AmountDisplay
          amount={bet.amount}
          subtitle={bet.stake}
          positive={positive}
          size="s"
          amountSize={amountSize}
        />
      </div>
    </div>
  );
}
