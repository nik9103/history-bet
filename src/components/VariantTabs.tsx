import styles from './VariantTabs.module.css';

export type HistoryVariant = 'v1' | 'v2' | 'v3' | 'v4';

type VariantTabsProps = {
  variant: HistoryVariant;
  onChange: (variant: HistoryVariant) => void;
};

export function VariantTabs({ variant, onChange }: VariantTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="History variants">
      {/* <button
        type="button"
        role="tab"
        aria-selected={variant === 'v1'}
        className={`${styles.tab} ${variant === 'v1' ? styles.tabActive : ''}`}
        onClick={() => onChange('v1')}
      >
        Вариант 1
      </button> */}
      {/* <button
        type="button"
        role="tab"
        aria-selected={variant === 'v2'}
        className={`${styles.tab} ${variant === 'v2' ? styles.tabActive : ''}`}
        onClick={() => onChange('v2')}
      >
        Вариант 2
      </button> */}
      <button
        type="button"
        role="tab"
        aria-selected={variant === 'v3'}
        className={`${styles.tab} ${variant === 'v3' ? styles.tabActive : ''}`}
        onClick={() => onChange('v3')}
      >
        Вариант 3
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={variant === 'v4'}
        className={`${styles.tab} ${variant === 'v4' ? styles.tabActive : ''}`}
        onClick={() => onChange('v4')}
      >
        Вариант 4
      </button>
    </div>
  );
}
