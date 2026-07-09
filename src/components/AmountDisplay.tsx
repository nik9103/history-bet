import styles from './AmountDisplay.module.css';

type AmountDisplayProps = {
  amount: string;
  subtitle?: string;
  positive?: boolean;
  size?: 'l' | 's';
  amountSize?: 'caption' | 'body';
};

export function AmountDisplay({
  amount,
  subtitle,
  positive,
  size = 'l',
  amountSize,
}: AmountDisplayProps) {
  const resolvedAmountSize = amountSize ?? (size === 's' ? 'caption' : 'body');
  const amountClass = positive === undefined
    ? styles.neutral
    : positive
      ? styles.positive
      : styles.negative;

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
