import deleteHistoryIcon from '../assets/icons/delete-history.svg';
import styles from './HistoryEmptyState.module.css';

type HistoryEmptyStateProps = {
  title: string;
  description: string;
};

export function HistoryEmptyState({ title, description }: HistoryEmptyStateProps) {
  return (
    <div className={styles.empty}>
      <div className={styles.inner}>
        <span className={styles.icon} aria-hidden="true">
          <img src={deleteHistoryIcon} alt="" width={24} height={24} />
        </span>
        <p className={styles.title}>{title}</p>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
}
