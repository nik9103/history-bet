import { useLayoutEffect, useRef, useState } from 'react';
import styles from './HistoryBottomTabs.module.css';

export type HistoryBottomTab = 'bet' | 'result';

type HistoryBottomTabsProps = {
  activeTab: HistoryBottomTab;
  onChange: (tab: HistoryBottomTab) => void;
};

type ThumbStyle = {
  width: number;
  left: number;
};

export function HistoryBottomTabs({ activeTab, onChange }: HistoryBottomTabsProps) {
  const betRef = useRef<HTMLButtonElement>(null);
  const resultRef = useRef<HTMLButtonElement>(null);
  const [thumbStyle, setThumbStyle] = useState<ThumbStyle>({ width: 0, left: 0 });

  useLayoutEffect(() => {
    const activeRef = activeTab === 'bet' ? betRef.current : resultRef.current;
    if (!activeRef) return;

    setThumbStyle({
      width: activeRef.offsetWidth,
      left: activeRef.offsetLeft,
    });
  }, [activeTab]);

  return (
    <div className={styles.bar}>
      <div className={styles.tabs} role="tablist" aria-label="History type">
        <span
          className={styles.thumb}
          style={{ width: thumbStyle.width, transform: `translateX(${thumbStyle.left}px)` }}
          aria-hidden="true"
        />
        <button
          ref={betRef}
          type="button"
          role="tab"
          aria-selected={activeTab === 'bet'}
          className={`${styles.tab} ${activeTab === 'bet' ? styles.tabActive : ''}`}
          onClick={() => onChange('bet')}
        >
          Bet History
        </button>
        <button
          ref={resultRef}
          type="button"
          role="tab"
          aria-selected={activeTab === 'result'}
          className={`${styles.tab} ${activeTab === 'result' ? styles.tabActive : ''}`}
          onClick={() => onChange('result')}
        >
          Result History
        </button>
      </div>
    </div>
  );
}
