import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { BetFilter } from '../data/historyData';
import { ChevronIcon } from './icons/Icons';
import styles from './HistoryBottomTabsV4.module.css';

export type HistoryBottomTab = 'bet' | 'result';
export type { BetFilter };

type HistoryBottomTabsV4Props = {
  activeTab: HistoryBottomTab;
  onChange: (tab: HistoryBottomTab) => void;
  betFilter: BetFilter;
  onBetFilterChange: (filter: BetFilter) => void;
  filterDisabled?: boolean;
};

type ThumbStyle = {
  width: number;
  left: number;
};

const FILTER_OPTIONS: { id: BetFilter; label: string; color: string }[] = [
  { id: 'all', label: 'All', color: 'var(--text-tertiary)' },
  { id: 'won', label: 'Won bets', color: 'var(--color-lime-400)' },
  { id: 'lost', label: 'Lost bets', color: 'var(--color-red-500)' },
];

export function HistoryBottomTabsV4({
  activeTab,
  onChange,
  betFilter,
  onBetFilterChange,
  filterDisabled = false,
}: HistoryBottomTabsV4Props) {
  const betRef = useRef<HTMLButtonElement>(null);
  const resultRef = useRef<HTMLButtonElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [thumbStyle, setThumbStyle] = useState<ThumbStyle>({ width: 0, left: 0 });
  const [menuOpen, setMenuOpen] = useState(false);

  const activeFilter = FILTER_OPTIONS.find((option) => option.id === betFilter) ?? FILTER_OPTIONS[0];

  useLayoutEffect(() => {
    const activeRef = activeTab === 'bet' ? betRef.current : resultRef.current;
    if (!activeRef) return;

    setThumbStyle({
      width: activeRef.offsetWidth,
      left: activeRef.offsetLeft,
    });
  }, [activeTab]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpen]);

  useEffect(() => {
    if (filterDisabled) {
      setMenuOpen(false);
    }
  }, [filterDisabled]);

  const handleFilterClick = () => {
    if (filterDisabled) return;
    setMenuOpen((open) => !open);
  };

  const handleFilterSelect = (filter: BetFilter) => {
    onBetFilterChange(filter);
    setMenuOpen(false);
  };

  return (
    <div className={styles.bar}>
      <div className={styles.barInner}>
        <div className={styles.tabs} role="tablist" aria-label="History type">
          <span
            className={styles.slider}
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

        <div className={styles.separator} aria-hidden="true" />

        <div
          ref={filterRef}
          className={`${styles.filterWrap} ${filterDisabled ? styles.filterDisabled : ''}`}
        >
          <button
            type="button"
            className={styles.filter}
            onClick={handleFilterClick}
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            disabled={filterDisabled}
          >
            <span className={styles.filterDot} style={{ background: activeFilter.color }} />
            <span className={styles.filterLabel}>{activeFilter.label}</span>
            <span className={`${styles.filterArrow} ${menuOpen ? styles.filterArrowOpen : ''}`}>
              <ChevronIcon direction="down" />
            </span>
          </button>

          <div className={`${styles.menu} ${menuOpen ? styles.menuOpen : ''}`} role="listbox">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={betFilter === option.id}
                className={styles.menuItem}
                onClick={() => handleFilterSelect(option.id)}
              >
                <span className={styles.menuDot} style={{ background: option.color }} />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
