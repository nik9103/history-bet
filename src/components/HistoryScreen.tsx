import { useCallback, useEffect, useRef, useState } from 'react';
import { matches } from '../data/historyData';
import { HistoryHeader } from './HistoryHeader';
import { HistoryScreenV2 } from './HistoryScreenV2';
import { MatchCard } from './MatchCard';
import { VariantTabs, type HistoryVariant } from './VariantTabs';
import { ViewReceipt } from './ViewReceipt';
import styles from './HistoryScreen.module.css';

type MatchesScrollState = {
  atTop: boolean;
  atBottom: boolean;
};

function getMatchesScrollState(container: HTMLDivElement): MatchesScrollState {
  return {
    atTop: container.scrollTop <= 1,
    atBottom:
      container.scrollTop + container.clientHeight >= container.scrollHeight - 1,
  };
}

function handleNestedWheel(event: WheelEvent) {
  const target = event.target as Element;
  const betsScroll = target.closest('[data-bets-scroll]') as HTMLDivElement | null;
  const roundsScroll = target.closest('[data-rounds-scroll]') as HTMLDivElement | null;

  if (betsScroll) {
    const atTop = betsScroll.scrollTop <= 0;
    const atBottom =
      betsScroll.scrollTop + betsScroll.clientHeight >= betsScroll.scrollHeight - 1;

    if (event.deltaY < 0 && !atTop) {
      betsScroll.scrollTop += event.deltaY;
      event.preventDefault();
      return;
    }

    if (event.deltaY > 0 && !atBottom) {
      betsScroll.scrollTop += event.deltaY;
      event.preventDefault();
      return;
    }
  }

  if (roundsScroll) {
    const atTop = roundsScroll.scrollTop <= 0;
    const atBottom =
      roundsScroll.scrollTop + roundsScroll.clientHeight >= roundsScroll.scrollHeight - 1;

    if (event.deltaY < 0 && !atTop) {
      roundsScroll.scrollTop += event.deltaY;
      event.preventDefault();
      return;
    }

    if (event.deltaY > 0 && !atBottom) {
      roundsScroll.scrollTop += event.deltaY;
      event.preventDefault();
      return;
    }
  }
}

function HistoryScreenV1() {
  const [view, setView] = useState<'history' | 'receipt'>('history');
  const [openMatchId, setOpenMatchId] = useState<string | null>(matches[0].id);
  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null);
  const [matchesScrollState, setMatchesScrollState] = useState<MatchesScrollState>({
    atTop: true,
    atBottom: true,
  });
  const matchesRef = useRef<HTMLDivElement>(null);

  const updateMatchesScrollState = useCallback(() => {
    const container = matchesRef.current;
    if (!container) return;
    setMatchesScrollState(getMatchesScrollState(container));
  }, []);

  useEffect(() => {
    const container = matchesRef.current;
    if (!container) return;

    const handleScroll = () => updateMatchesScrollState();
    const handleWheel = (event: WheelEvent) => handleNestedWheel(event);

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: false });

    const resizeObserver = new ResizeObserver(() => updateMatchesScrollState());
    resizeObserver.observe(container);

    const frame = requestAnimationFrame(updateMatchesScrollState);

    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleWheel);
      resizeObserver.disconnect();
    };
  }, [openMatchId, expandedRoundId, updateMatchesScrollState]);

  const handleToggleMatch = (matchId: string) => {
    setOpenMatchId((current) => (current === matchId ? null : matchId));
    setExpandedRoundId(null);
  };

  if (view === 'receipt') {
    return <ViewReceipt onBack={() => setView('history')} onClose={() => setView('history')} />;
  }

  return (
    <>
      <HistoryHeader onClose={() => undefined} />
      <div className={styles.content}>
        <div ref={matchesRef} className={styles.matches}>
          {matches.map((match, index) => (
            <MatchCard
              key={match.id}
              match={match}
              isOpen={openMatchId === match.id}
              hasPeekBelow={index < matches.length - 1}
              expandedRoundId={openMatchId === match.id ? expandedRoundId : null}
              matchesScrollRef={matchesRef}
              onToggle={() => handleToggleMatch(match.id)}
              onExpandRound={setExpandedRoundId}
              onViewReceipt={() => setView('receipt')}
            />
          ))}
        </div>
        <div
          className={`${styles.fadeTop} ${matchesScrollState.atTop ? styles.fadeHidden : ''}`}
          aria-hidden="true"
        />
        <div
          className={`${styles.fadeBottom} ${matchesScrollState.atBottom ? styles.fadeHidden : ''}`}
          aria-hidden="true"
        />
      </div>
    </>
  );
}

export function HistoryScreen() {
  const [variant, setVariant] = useState<HistoryVariant>('v1');

  return (
    <div className={styles.app}>
      <div className={styles.wrapper}>
        <VariantTabs variant={variant} onChange={setVariant} />
        <div className={styles.container}>
          <div className={styles.screen}>
            {variant === 'v1' ? <HistoryScreenV1 /> : <HistoryScreenV2 />}
          </div>
        </div>
      </div>
    </div>
  );
}
