import { CalendarIcon, CloseIcon, BackIcon } from './icons/Icons';
import styles from './HistoryHeader.module.css';

type HistoryHeaderProps = {
  mode?: 'list' | 'detail' | 'receipt';
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
};

export function HistoryHeader({
  mode = 'list',
  title = 'History',
  subtitle,
  onBack,
  onClose,
}: HistoryHeaderProps) {
  const hasBack = mode === 'receipt' || mode === 'detail';

  return (
    <header className={`${styles.header} ${hasBack ? styles.receipt : ''}`}>
      <button
        type="button"
        className={styles.iconBtn}
        onClick={hasBack ? onBack : undefined}
        aria-label={hasBack ? 'Back' : 'Calendar'}
      >
        {hasBack ? <BackIcon /> : <CalendarIcon />}
      </button>

      <div className={styles.titleWrap}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close">
        <CloseIcon />
      </button>
    </header>
  );
}
