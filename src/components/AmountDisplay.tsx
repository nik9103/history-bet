import styles from './AmountDisplay.module.css';
import type { AmountVariant } from '../data/historyData';

type AmountDisplayProps = {
  amount: string;
  subtitle?: string;
  positive?: boolean;
  variant?: AmountVariant | 'neutral';
  size?: 'l' | 's';
  amountSize?: 'caption' | 'body';
};

function resolveAmountClass(
  positive: boolean | undefined,
  variant: AmountVariant | 'neutral' | undefined,
): string {
  if (variant === 'refund') return styles.refund;
  if (variant === 'positive') return styles.positive;
  if (variant === 'negative') return styles.negative;
  if (variant === 'neutral') return styles.neutral;
  if (positive === undefined) return styles.neutral;
  return positive ? styles.positive : styles.negative;
}

export function AmountDisplay({
  amount,
  subtitle,
  positive,
  variant,
  size = 'l',
  amountSize,
}: AmountDisplayProps) {
  const resolvedAmountSize = amountSize ?? (size === 's' ? 'caption' : 'body');
  const amountClass = resolveAmountClass(positive, variant);

  return (
    <div className={styles.wrap}>
      <span
        className={`${styles.amount} ${resolvedAmountSize === 'caption' ? styles.amountCaption : ''} ${amountClass}`}
      >
        {amount}
      </span>
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
    </div>
  );
}
