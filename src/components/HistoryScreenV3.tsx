import { useCallback, useEffect, useRef, useState } from 'react';
import {
  findRoundInMatches,
  formatThrowDetailSubtitle,
  formatThrowDetailTitle,
  getBetHistoryRoundGroups,
  getParticipatedRoundGroups,
  type MatchItem,
  type RoundItem,
} from '../data/historyData';
import { BetRowV3 } from './BetRowV3';
import { HistoryBottomTabs, type HistoryBottomTab } from './HistoryBottomTabs';
import { HistoryHeader } from './HistoryHeader';
import { MatchGroupV3 } from './MatchGroupV3';
import { ViewReceipt } from './ViewReceipt';
import { MarketIcon } from './icons/MarketIcon';
import { RewatchIcon, ChevronIcon } from './icons/Icons';
import styles from './HistoryScreenV3.module.css';

type View = 'list' | 'throw' | 'receipt';

type ScrollState = {
  atTop: boolean;
  atBottom: boolean;
  firstVisibleRoundId: string | null;
};

const EXPAND_ANIMATION_MS = 300;
const SCROLL_ALIGN_THRESHOLD = 2;

function getScrollState(container: HTMLDivElement, trackRounds: boolean): ScrollState {
  const atTop = container.scrollTop <= 1;
  const atBottom =
    container.scrollTop + container.clientHeight >= container.scrollHeight - 1;

  if (!trackRounds) {
    return { atTop, atBottom, firstVisibleRoundId: null };
  }

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

function getScrollTopToAlignWithContainer(
  scrollContainer: HTMLElement,
  target: HTMLElement,
): number {
  const containerTop = scrollContainer.getBoundingClientRect().top;
  const targetTop = target.getBoundingClientRect().top;
  return scrollContainer.scrollTop + (targetTop - containerTop);
}

function isElementAlignedToContainerTop(
  scrollContainer: HTMLElement,
  target: HTMLElement,
  threshold = SCROLL_ALIGN_THRESHOLD,
): boolean {
  const containerTop = scrollContainer.getBoundingClientRect().top;
  const targetTop = target.getBoundingClientRect().top;
  return Math.abs(targetTop - containerTop) <= threshold;
}

function ensureElementAtTop(container: HTMLDivElement, target: HTMLElement) {
  if (!isElementAlignedToContainerTop(container, target)) {
    container.scrollTo({
      top: Math.max(0, getScrollTopToAlignWithContainer(container, target)),
      behavior: 'auto',
    });
  }
}

type SelectedRound = {
  match: MatchItem;
  round: RoundItem;
};

export function HistoryScreenV3() {
  const [view, setView] = useState<View>('list');
  const [historyTab, setHistoryTab] = useState<HistoryBottomTab>('bet');
  const [selectedRound, setSelectedRound] = useState<SelectedRound | null>(null);
  const [expandedBetId, setExpandedBetId] = useState<string | null>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    atTop: true,
    atBottom: true,
    firstVisibleRoundId: null,
  });
  const [fadeEnabled, setFadeEnabled] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollRafRef = useRef(0);

  const roundGroups =
    historyTab === 'bet' ? getBetHistoryRoundGroups() : getParticipatedRoundGroups();
  const trackRounds = view === 'list';

  const updateScrollState = useCallback(() => {
    const container = listRef.current;
    if (!container) return;
    setScrollState(getScrollState(container, trackRounds));
  }, [trackRounds]);

  useEffect(() => {
    setFadeEnabled(false);
  }, [expandedBetId, selectedRound, view, historyTab]);

  useEffect(() => {
    if (!expandedBetId || !listRef.current || view !== 'throw') return;

    const container = listRef.current;
    let cancelled = false;
    let finishTimeoutId = 0;

    const scrollToExpanded = () => {
      if (cancelled) return;

      const expandedEl = container.querySelector(
        `[data-bet-id="${expandedBetId}"]`,
      ) as HTMLElement | null;

      if (!expandedEl) return;

      isProgrammaticScrollRef.current = true;
      container.scrollTo({
        top: Math.max(0, getScrollTopToAlignWithContainer(container, expandedEl)),
        behavior: 'auto',
      });
    };

    scrollToExpanded();

    const animationTimeoutId = window.setTimeout(() => {
      if (cancelled) return;

      const expandedEl = container.querySelector(
        `[data-bet-id="${expandedBetId}"]`,
      ) as HTMLElement | null;

      if (expandedEl) {
        ensureElementAtTop(container, expandedEl);
      }

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
  }, [expandedBetId, view, updateScrollState]);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!isProgrammaticScrollRef.current) {
        setFadeEnabled(true);
      }

      if (scrollRafRef.current) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = 0;
        updateScrollState();
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => updateScrollState());
    resizeObserver.observe(container);

    const frame = requestAnimationFrame(updateScrollState);

    return () => {
      cancelAnimationFrame(frame);
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
      }
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [view, selectedRound, expandedBetId, historyTab, updateScrollState]);

  const handleSelectRound = (matchId: string, roundId: string) => {
    const found = findRoundInMatches(matchId, roundId);
    if (!found) return;

    setSelectedRound(found);
    setExpandedBetId(null);
    setView('throw');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedRound(null);
    setExpandedBetId(null);
  };

  const handleOpenReceipt = () => {
    setView('receipt');
  };

  const handleScrollToTop = () => {
    const container = listRef.current;
    if (!container) return;

    isProgrammaticScrollRef.current = true;
    container.scrollTo({ top: 0, behavior: 'smooth' });

    window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      updateScrollState();
    }, 300);
  };

  if (view === 'receipt' && selectedRound) {
    const matchNumber = selectedRound.match.title.replace(/[^\d]/g, '');

    return (
      <ViewReceipt
        title="Bet receipt"
        subtitle={formatThrowDetailSubtitle(selectedRound.match, selectedRound.round)}
        comboTitle={`Combo: ${matchNumber}`}
        roundIdLabel="Round ID: jfk473jsyeK"
        onBack={() => setView('throw')}
        onClose={handleBackToList}
      />
    );
  }

  if (view === 'throw' && selectedRound) {
    const showFadeTop = fadeEnabled && !scrollState.atTop;
    const showFadeBottom = fadeEnabled && !scrollState.atBottom;
    const showScrollTop = !scrollState.atTop;

    return (
      <div className={styles.screen}>
        <HistoryHeader
          mode="detail"
          title={formatThrowDetailTitle(selectedRound.match, selectedRound.round)}
          onBack={handleBackToList}
          onClose={handleBackToList}
        />
        <div className={styles.content}>
          <div ref={listRef} className={`${styles.list} ${styles.listThrow}`}>
            <div className={styles.throwPanel}>
              <div className={styles.hero}>
                <MarketIcon size="lg" />
                <h2 className={styles.throwTitle}>{selectedRound.round.title}</h2>
                <p className={styles.throwMeta}>
                  {selectedRound.match.date}, {selectedRound.round.time}
                  {selectedRound.round.dealer ? ` | ${selectedRound.round.dealer}` : ''}
                </p>
                <button type="button" className={styles.rewatchBtn}>
                  Rewatch
                  <RewatchIcon />
                </button>
              </div>

              {selectedRound.round.guessedCount && selectedRound.round.balance && (
                <div className={styles.summary}>
                  <span>{selectedRound.round.guessedCount}</span>
                  <span>{selectedRound.round.balance}</span>
                </div>
              )}

              <div className={styles.betsList}>
                {selectedRound.round.bets?.map((bet) => (
                  <BetRowV3
                    key={bet.id}
                    bet={bet}
                    expanded={expandedBetId === bet.id}
                    onToggleExpand={() =>
                      setExpandedBetId((current) => (current === bet.id ? null : bet.id))
                    }
                  />
                ))}
              </div>
            </div>
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
        <div className={styles.receiptBar}>
          <div className={styles.receiptBarSide} aria-hidden="true" />
          <button type="button" className={styles.receiptBtn} onClick={handleOpenReceipt}>
            View receipt
          </button>
          <div className={styles.receiptBarSide}>
            <button
              type="button"
              className={`${styles.scrollTopBtn} ${showScrollTop ? '' : styles.scrollTopBtnHidden}`}
              onClick={handleScrollToTop}
              aria-label="Scroll to top"
            >
              <ChevronIcon direction="up" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showFadeTop = fadeEnabled && !scrollState.atTop;
  const showFadeBottom = fadeEnabled && !scrollState.atBottom;

  return (
    <div className={styles.screen}>
      <HistoryHeader onClose={() => undefined} />
      <div className={`${styles.content} ${styles.contentWithBottomTabs}`}>
        <div ref={listRef} className={styles.list}>
          {roundGroups.map((group) => (
            <MatchGroupV3
              key={group.match.id}
              match={group.match}
              dateLabel={group.dateLabel}
              rounds={group.rounds}
              firstVisibleRoundId={scrollState.firstVisibleRoundId}
              onSelectRound={handleSelectRound}
            />
          ))}
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
      <HistoryBottomTabs activeTab={historyTab} onChange={setHistoryTab} />
    </div>
  );
}
