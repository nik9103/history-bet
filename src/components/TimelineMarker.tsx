import styles from './TimelineMarker.module.css';

type TimelineMarkerProps = {
  number: number;
  hideTopLine?: boolean;
  hideBottomLine?: boolean;
};

export function TimelineMarker({
  number,
  hideTopLine = false,
  hideBottomLine = false,
}: TimelineMarkerProps) {
  return (
    <div className={styles.marker}>
      <div className={`${styles.line} ${styles.top} ${hideTopLine ? styles.hidden : ''}`} />
      <div className={styles.node}>
        <span>{number}</span>
      </div>
      <div className={`${styles.line} ${styles.bottom} ${hideBottomLine ? styles.hidden : ''}`} />
    </div>
  );
}
