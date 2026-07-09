import { useCallback, useEffect, useRef, useState } from 'react';
import { matches, type MatchItem } from '../data/historyData';
import { HistoryHeader } from './HistoryHeader';
import { MatchRowV2 } from './MatchRowV2';
import { RoundItemV2 } from './RoundItemV2';
import { ViewReceipt } from './ViewReceipt';
import styles from './HistoryScreenV2.module.css';

type ScrollState = {
  atTop: boolean;
  atBottom: boolean;
  firstVisibleRoundId: string | null;
};

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

function formatMatchDate(date: string): string {
  const [day, month] = date.split(' ');
  return `2026 ${month} ${day}`;
}

function getMatchDetailTitle(match: MatchItem) {
  const number = match.title.replace(/[^\d]/g, '');
  return `Match ${number}`;
}

function getMatchDetailSubtitle(match: MatchItem) {
  return `${formatMatchDate(match.date)} | Nards Combo`;
}

const EXPAND_ANIMATION_MS = 300;
const ROUND_PEEK_HEIGHT = 51;

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

export function HistoryScreenV2() {
  const [view, setView] = useState<'list' | 'match' | 'receipt'>('list');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    atTop: true,
    atBottom: true,
    firstVisibleRoundId: null,
  });
  const [fadeEnabled, setFadeEnabled] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);

  const selectedMatch = matches.find((match) => match.id === selectedMatchId) ?? null;

  const updateScrollState = useCallback(() => {
    const container = listRef.current;
    if (!container) return;
    setScrollState(getScrollState(container));
  }, []);

  useEffect(() => {
    setFadeEnabled(false);
  }, [expandedRoundId, selectedMatchId]);

  useEffect(() => {
    if (!expandedRoundId || !listRef.current || view !== 'match') return;

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
  }, [view, selectedMatchId, expandedRoundId, updateScrollState]);

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setExpandedRoundId(null);
    setView('match');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedMatchId(null);
    setExpandedRoundId(null);
  };

  if (view === 'receipt') {
    return (
      <ViewReceipt onBack={() => setView('match')} onClose={() => setView('list')} />
    );
  }

  if (view === 'match' && selectedMatch) {
    const showFadeTop = fadeEnabled && !scrollState.atTop;
    const showFadeBottom = fadeEnabled && !scrollState.atBottom;

    const getTimelineLines = (roundId: string, index: number) => {
      if (selectedMatch.rounds.length === 1) {
        return { hideTopLine: true, hideBottomLine: true };
      }

      return {
        hideTopLine: roundId === scrollState.firstVisibleRoundId,
        hideBottomLine: index === selectedMatch.rounds.length - 1,
      };
    };

    return (
      <>
        <HistoryHeader
          mode="detail"
          title={getMatchDetailTitle(selectedMatch)}
          subtitle={getMatchDetailSubtitle(selectedMatch)}
          onBack={handleBackToList}
          onClose={handleBackToList}
        />
        <div className={`${styles.content} ${styles.contentMatch}`}>
          <div ref={listRef} className={`${styles.list} ${styles.listMatch}`}>
            {selectedMatch.rounds.map((round, index) => {
              const { hideTopLine, hideBottomLine } = getTimelineLines(round.id, index);

              return (
                <RoundItemV2
                  key={round.id}
                  round={round}
                  hideTopLine={hideTopLine}
                  hideBottomLine={hideBottomLine}
                  expanded={expandedRoundId === round.id}
                  onToggleExpand={() =>
                    setExpandedRoundId((current) => (current === round.id ? null : round.id))
                  }
                  onViewReceipt={() => setView('receipt')}
                />
              );
            })}
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
      </>
    );
  }

  return (
    <>
      <HistoryHeader onClose={() => undefined} />
      <div className={styles.content}>
        <div ref={listRef} className={styles.list}>
          {matches.map((match) => (
            <MatchRowV2 key={match.id} match={match} onSelect={() => handleSelectMatch(match.id)} />
          ))}
        </div>
        <div
          className={`${styles.fadeTop} ${scrollState.atTop ? styles.fadeHidden : ''}`}
          aria-hidden="true"
        />
        <div
          className={`${styles.fadeBottom} ${scrollState.atBottom ? styles.fadeHidden : ''}`}
          aria-hidden="true"
        />
      </div>
    </>
  );
}
