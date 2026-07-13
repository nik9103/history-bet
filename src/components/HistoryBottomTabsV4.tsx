import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { BetFilter } from '../data/historyData';
import { ChevronIcon, FilterIcon } from './icons/Icons';
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

type FilterIconType = 'all' | 'settled' | 'unsettled' | 'refund';

type FilterOption = {
  id: BetFilter;
  label: string;
  icon: FilterIconType;
};

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All', icon: 'all' },
  { id: 'settled', label: 'Settled', icon: 'settled' },
  { id: 'unsettled', label: 'Unsettled', icon: 'unsettled' },
  { id: 'refund', label: 'Refund', icon: 'refund' },
];

function FilterIndicator({ option }: { option: FilterOption }) {
  return (
    <span className={styles.filterIcon} aria-hidden="true">
      <FilterIcon type={option.icon} />
    </span>
  );
}

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

    // Defer so the opening click doesn't immediately close the menu.
    const timeoutId = window.setTimeout(() => {
      document.addEventListener('mousedown', handlePointerDown);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (activeTab !== 'bet') {
      setMenuOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (filterDisabled) {
      setMenuOpen(false);
    }
  }, [filterDisabled]);

  const handleFilterClick = () => {
    if (activeTab !== 'bet') return;
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

        <div
          ref={filterRef}
          className={`${styles.filterSection} ${activeTab === 'bet' ? styles.filterSectionVisible : ''} ${menuOpen ? styles.filterSectionMenuOpen : ''}`}
        >
          <div className={styles.filterSectionClip}>
            <div className={styles.separator} aria-hidden="true" />

            <div className={styles.filterWrap}>
              <button
                type="button"
                className={styles.filter}
                onClick={handleFilterClick}
                aria-haspopup="listbox"
                aria-expanded={menuOpen}
              >
                <FilterIndicator option={activeFilter} />
                <span className={styles.filterLabel}>{activeFilter.label}</span>
                <span className={`${styles.filterArrow} ${menuOpen ? styles.filterArrowOpen : ''}`}>
                  <ChevronIcon direction="down" />
                </span>
              </button>
            </div>
          </div>

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
                <FilterIndicator option={option} />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
