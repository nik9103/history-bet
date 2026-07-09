import styles from './ActiveBadge.module.css';

export function ActiveBadge() {
  return (
    <span className={styles.badge}>
      <span className={styles.dotWrap}>
        <span className={styles.dotGlow} />
        <span className={styles.dot} />
      </span>
      <span className={styles.label}>Active</span>
    </span>
  );
}
