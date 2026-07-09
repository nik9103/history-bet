import marketIconUrl from '../../assets/icons/market-icon.svg';
import { SpinnerIcon } from './Icons';
import styles from './DiceIcon.module.css';

type MarketIconProps = {
  loading?: boolean;
  size?: 'sm' | 'lg';
};

export function MarketIcon({ loading = false, size = 'sm' }: MarketIconProps) {
  if (loading) {
    return (
      <span className={`${styles.market} ${styles.loading}`}>
        <SpinnerIcon className={styles.spinnerImg} />
      </span>
    );
  }

  return (
    <span className={`${styles.market} ${size === 'lg' ? styles.marketLg : ''}`}>
      <img src={marketIconUrl} alt="" className={styles.marketImg} />
    </span>
  );
}
