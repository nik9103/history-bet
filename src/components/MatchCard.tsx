import { useCallback, useEffect, useRef, useState } from 'react';
import type { MatchItem } from '../data/historyData';
import { ActiveBadge } from './ActiveBadge';
import { AmountDisplay } from './AmountDisplay';
import { RoundItem } from './RoundItem';
import { ChevronIcon } from './icons/Icons';
import styles from './MatchCard.module.css';

type RoundsScrollState = {
  atTop: boolean;
  atBottom: boolean;
  firstVisibleRoundId: string | null;
};

type MatchCardProps = {
  match: MatchItem;
  isOpen: boolean;
  hasPeekBelow: boolean;
  expandedRoundId: string | null;
  matchesScrollRef: React.RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onExpandRound: (roundId: string | null) => void;
  onViewReceipt?: () => void;
};

function getRoundsScrollState(container: HTMLDivElement): RoundsScrollState {
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

const EXPAND_ANIMATION_MS = 300;
const MATCH_OPEN_ANIMATION_MS = 280;
const ROUND_PEEK_HEIGHT = 51;
const SCROLL_ALIGN_THRESHOLD = 2;

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

function scrollCardToMatchesTop(
  matchesContainer: HTMLDivElement,
  card: HTMLElement,
  behavior: ScrollBehavior = 'auto',
) {
  matchesContainer.scrollTo({
    top: getScrollTopToAlignWithContainer(matchesContainer, card),
    behavior,
  });
}

function ensureCardAtMatchesTop(
  matchesContainer: HTMLDivElement,
  card: HTMLElement,
) {
  if (!isElementAlignedToContainerTop(matchesContainer, card)) {
    scrollCardToMatchesTop(matchesContainer, card);
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

export function MatchCard({
  match,
  isOpen,
  hasPeekBelow,
  expandedRoundId,
  matchesScrollRef,
  onToggle,
  onExpandRound,
  onViewReceipt,
}: MatchCardProps) {
  const [roundsScrollState, setRoundsScrollState] = useState<RoundsScrollState>({
    atTop: true,
    atBottom: true,
    firstVisibleRoundId: null,
  });
  const cardRef = useRef<HTMLElement>(null);
  const roundsScrollRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const [fadeEnabled, setFadeEnabled] = useState(false);

  const updateRoundsScrollState = useCallback(() => {
    const container = roundsScrollRef.current;
    if (!container) return;
    setRoundsScrollState(getRoundsScrollState(container));
  }, []);

  useEffect(() => {
    if (!isOpen || !cardRef.current || !matchesScrollRef.current) return;

    const matchesContainer = matchesScrollRef.current;
    const card = cardRef.current;
    let cancelled = false;

    if (roundsScrollRef.current) {
      roundsScrollRef.current.scrollTop = 0;
    }

    scrollCardToMatchesTop(matchesContainer, card);

    const verifyTimeoutId = window.setTimeout(() => {
      if (cancelled || !cardRef.current || !matchesScrollRef.current) return;

      ensureCardAtMatchesTop(matchesScrollRef.current, cardRef.current);

      if (roundsScrollRef.current) {
        roundsScrollRef.current.scrollTop = 0;
      }

      updateRoundsScrollState();
    }, MATCH_OPEN_ANIMATION_MS);

    const frame = requestAnimationFrame(() => {
      if (cancelled || !cardRef.current || !matchesScrollRef.current) return;
      ensureCardAtMatchesTop(matchesScrollRef.current, cardRef.current);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(verifyTimeoutId);
    };
  }, [isOpen, matchesScrollRef, updateRoundsScrollState]);

  useEffect(() => {
    setFadeEnabled(false);
  }, [expandedRoundId, isOpen]);

  useEffect(() => {
    if (!expandedRoundId || !roundsScrollRef.current || !isOpen) return;

    const container = roundsScrollRef.current;
    const matchesContainer = matchesScrollRef.current;
    const card = cardRef.current;
    let cancelled = false;
    let finishTimeoutId = 0;

    if (matchesContainer && card) {
      ensureCardAtMatchesTop(matchesContainer, card);
    }

    const scrollToExpanded = (behavior: ScrollBehavior) => {
      if (cancelled) return;

      const expandedEl = container.querySelector(
        `[data-round-id="${expandedRoundId}"]`,
      ) as HTMLElement | null;

      if (!expandedEl) return;

      if (matchesContainer && card) {
        ensureCardAtMatchesTop(matchesContainer, card);
      }

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
        updateRoundsScrollState();
      }, EXPAND_ANIMATION_MS);
    }, EXPAND_ANIMATION_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(animationTimeoutId);
      window.clearTimeout(finishTimeoutId);
      isProgrammaticScrollRef.current = false;
    };
  }, [expandedRoundId, isOpen, updateRoundsScrollState]);

  useEffect(() => {
    const container = roundsScrollRef.current;
    if (!container || !isOpen) return;

    const handleScroll = () => {
      if (!isProgrammaticScrollRef.current) {
        setFadeEnabled(true);
      }
      updateRoundsScrollState();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    const resizeObserver = new ResizeObserver(() => updateRoundsScrollState());
    resizeObserver.observe(container);

    const frame = requestAnimationFrame(updateRoundsScrollState);

    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [isOpen, match.rounds, expandedRoundId, updateRoundsScrollState]);

  const getTimelineLines = (roundId: string, index: number) => {
    if (match.rounds.length === 1) {
      return { hideTopLine: true, hideBottomLine: true };
    }

    return {
      hideTopLine: roundId === roundsScrollState.firstVisibleRoundId,
      hideBottomLine: index === match.rounds.length - 1,
    };
  };

  const showFadeTop = fadeEnabled && !roundsScrollState.atTop;
  const showFadeBottom = fadeEnabled && !roundsScrollState.atBottom;

  return (
    <article
      ref={cardRef}
      className={`${styles.card} ${isOpen ? styles.open : styles.closed} ${isOpen && hasPeekBelow ? styles.openWithPeek : ''} ${isOpen && !hasPeekBelow ? styles.openFull : ''}`}
    >
      <button type="button" className={styles.header} onClick={onToggle}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <span className={styles.title}>{match.title}</span>
            {match.active && <ActiveBadge />}
          </div>
          <span className={styles.meta}>
            {match.date}
            <span className={styles.dot}> · </span>
            ID:{match.matchId}
          </span>
        </div>
        <div className={styles.headerRight}>
          {match.summary && (
            <AmountDisplay
              amount={match.summary.amount}
              subtitle={match.summary.subtitle}
              positive={match.summary.amountPositive}
            />
          )}
          <span className={`${styles.chevron} ${isOpen ? styles.chevronUp : ''}`}>
            <ChevronIcon direction="down" />
          </span>
        </div>
      </button>

      <div className={`${styles.roundsWrap} ${isOpen ? styles.roundsOpen : ''}`}>
        <div className={styles.roundsInner}>
          <div className={styles.roundsContent}>
            <div
              ref={roundsScrollRef}
              className={styles.roundsScroll}
              data-rounds-scroll=""
            >
              {match.rounds.map((round, index) => {
                const { hideTopLine, hideBottomLine } = getTimelineLines(round.id, index);

                return (
                  <RoundItem
                    key={round.id}
                    round={round}
                    hideTopLine={hideTopLine}
                    hideBottomLine={hideBottomLine}
                    expanded={expandedRoundId === round.id}
                    onToggleExpand={() =>
                      onExpandRound(expandedRoundId === round.id ? null : round.id)
                    }
                    onViewReceipt={onViewReceipt}
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
        </div>
      </div>
    </article>
  );
}
