import { useCallback, useEffect, useRef, useState } from 'react';
import {
  filterBetHistoryRoundGroups,
  getBetHistoryRoundGroups,
  getHistoryEmptyStateContent,
  getResultHistoryRoundGroups,
  type BetFilter,
} from '../data/historyData';
import { HistoryBottomTabsV4, type HistoryBottomTab } from './HistoryBottomTabsV4';
import { HistoryEmptyState } from './HistoryEmptyState';
import { HistoryHeader } from './HistoryHeader';
import { MatchGroupV4 } from './MatchGroupV4';
import { ViewReceipt } from './ViewReceipt';
import styles from './HistoryScreenV4.module.css';

type View = 'list' | 'receipt';

type ScrollState = {
  atTop: boolean;
  atBottom: boolean;
  firstVisibleRoundId: string | null;
};

const EXPAND_ANIMATION_MS = 300;
const ROUND_PEEK_HEIGHT = 51;

function getScrollState(container: HTMLDivElement): ScrollState {
  const atTop = container.scrollTop <= 1;
  const atBottom =
    container.scrollTop + container.clientHeight >= container.scrollHeight - 1;

  const containerTop = container.getBoundingClientRect().top;
  let firstVisibleRoundId: string | null = null;

  container.querySelectorAll<HTMLElement>('[data-round-id]').forEach((element) => {
    if (firstVisibleRoundId) return;

    const rect = element.getBoundingClientRect();
    if (rect.bottom > containerTop + 2) {
      firstVisibleRoundId = element.dataset.roundId ?? null;
    }
  });

  return { atTop, atBottom, firstVisibleRoundId };
}

function handleNestedWheel(event: WheelEvent) {
  const target = event.target as Element;
  const betsScroll = target.closest('[data-bets-scroll]') as HTMLDivElement | null;

  if (betsScroll) {
    const atTop = betsScroll.scrollTop <= 0;
    const atBottom =
      betsScroll.scrollTop + betsScroll.clientHeight >= betsScroll.scrollHeight - 1;

    if (event.deltaY < 0 && !atTop) {
      betsScroll.scrollTop += event.deltaY;
      event.preventDefault();
    } else if (event.deltaY > 0 && !atBottom) {
      betsScroll.scrollTop += event.deltaY;
      event.preventDefault();
    }
  }
}

function getExpandedRoundScrollTop(
  container: HTMLDivElement,
  expandedEl: HTMLElement,
): number {
  const scrollTop = expandedEl.offsetTop;
  const nextEl = expandedEl.nextElementSibling as HTMLElement | null;

  if (!nextEl) return scrollTop;

  const viewportBottom = scrollTop + container.clientHeight;
  if (nextEl.offsetTop < viewportBottom - 1) return scrollTop;

  return Math.max(scrollTop, nextEl.offsetTop + ROUND_PEEK_HEIGHT - container.clientHeight);
}

export function HistoryScreenV4() {
  const [view, setView] = useState<View>('list');
  const [historyTab, setHistoryTab] = useState<HistoryBottomTab>('bet');
  const [betFilter, setBetFilter] = useState<BetFilter>('all');
  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    atTop: true,
    atBottom: true,
    firstVisibleRoundId: null,
  });
  const [fadeEnabled, setFadeEnabled] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);

  const roundGroups =
    historyTab === 'bet'
      ? filterBetHistoryRoundGroups(getBetHistoryRoundGroups(), betFilter)
      : getResultHistoryRoundGroups();
  const filterDisabled = historyTab === 'result';

  const handleHistoryTabChange = (tab: HistoryBottomTab) => {
    setHistoryTab(tab);
    setExpandedRoundId(null);
    setView('list');
  };

  const handleBetFilterChange = (filter: BetFilter) => {
    setBetFilter(filter);
    setExpandedRoundId(null);
  };

  const updateScrollState = useCallback(() => {
    const container = listRef.current;
    if (!container) return;
    setScrollState(getScrollState(container));
  }, []);

  useEffect(() => {
    setFadeEnabled(false);
  }, [expandedRoundId, historyTab, betFilter, view]);

  useEffect(() => {
    if (!expandedRoundId || !listRef.current || view !== 'list') return;

    const container = listRef.current;
    let cancelled = false;
    let finishTimeoutId = 0;

    const scrollToExpanded = (behavior: ScrollBehavior) => {
      if (cancelled) return;

      const expandedEl = container.querySelector(
        `[data-round-id="${expandedRoundId}"]`,
      ) as HTMLElement | null;

      if (!expandedEl) return;

      isProgrammaticScrollRef.current = true;
      container.scrollTo({
        top: getExpandedRoundScrollTop(container, expandedEl),
        behavior,
      });
    };

    scrollToExpanded('auto');

    const animationTimeoutId = window.setTimeout(() => {
      scrollToExpanded('smooth');
      finishTimeoutId = window.setTimeout(() => {
        if (cancelled) return;
        isProgrammaticScrollRef.current = false;
        updateScrollState();
      }, EXPAND_ANIMATION_MS);
    }, EXPAND_ANIMATION_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(animationTimeoutId);
      window.clearTimeout(finishTimeoutId);
      isProgrammaticScrollRef.current = false;
    };
  }, [expandedRoundId, view, updateScrollState]);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!isProgrammaticScrollRef.current) {
        setFadeEnabled(true);
      }
      updateScrollState();
    };
    const handleWheel = (event: WheelEvent) => handleNestedWheel(event);

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: false });

    const resizeObserver = new ResizeObserver(() => updateScrollState());
    resizeObserver.observe(container);

    const frame = requestAnimationFrame(updateScrollState);

    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleWheel);
      resizeObserver.disconnect();
    };
  }, [view, expandedRoundId, historyTab, betFilter, updateScrollState]);

  const handleToggleRound = (roundId: string) => {
    setExpandedRoundId((current) => (current === roundId ? null : roundId));
  };

  if (view === 'receipt') {
    return <ViewReceipt onBack={() => setView('list')} onClose={() => setView('list')} />;
  }

  const showFadeTop = fadeEnabled && !scrollState.atTop;
  const showFadeBottom = fadeEnabled && !scrollState.atBottom;
  const isEmpty = roundGroups.length === 0;
  const emptyState = getHistoryEmptyStateContent(historyTab, betFilter);

  return (
    <div className={styles.screen}>
      <HistoryHeader onClose={() => undefined} />
      <div className={`${styles.content} ${styles.contentWithBottomTabs}`}>
        <div ref={listRef} className={`${styles.list} ${isEmpty ? styles.listEmpty : ''}`}>
          {isEmpty ? (
            <HistoryEmptyState title={emptyState.title} description={emptyState.description} />
          ) : (
            roundGroups.map((group) => (
              <MatchGroupV4
                key={group.match.id}
                match={group.match}
                dateLabel={group.dateLabel}
                rounds={group.rounds}
                firstVisibleRoundId={scrollState.firstVisibleRoundId}
                expandedRoundId={expandedRoundId}
                onToggleRound={handleToggleRound}
                onViewReceipt={() => setView('receipt')}
              />
            ))
          )}
        </div>
        <div
          className={`${styles.fadeTop} ${showFadeTop ? '' : styles.fadeHidden}`}
          aria-hidden="true"
        />
        <div
          className={`${styles.fadeBottom} ${showFadeBottom ? '' : styles.fadeHidden}`}
          aria-hidden="true"
        />
      </div>
      <HistoryBottomTabsV4
        activeTab={historyTab}
        onChange={handleHistoryTabChange}
        betFilter={betFilter}
        onBetFilterChange={handleBetFilterChange}
        filterDisabled={filterDisabled}
      />
    </div>
  );
}
