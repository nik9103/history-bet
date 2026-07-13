import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getBetHistoryMatches,
  getParticipatedMatches,
  matches,
} from '../data/historyData';
import { HistoryBottomTabs, type HistoryBottomTab } from './HistoryBottomTabs';
import { HistoryHeader } from './HistoryHeader';
import { HistoryScreenV2 } from './HistoryScreenV2';
import { HistoryScreenV3 } from './HistoryScreenV3';
import { HistoryScreenV4 } from './HistoryScreenV4';
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
  const [historyTab, setHistoryTab] = useState<HistoryBottomTab>('bet');
  const [openMatchId, setOpenMatchId] = useState<string | null>(matches[0].id);
  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null);
  const [matchesScrollState, setMatchesScrollState] = useState<MatchesScrollState>({
    atTop: true,
    atBottom: true,
  });
  const matchesRef = useRef<HTMLDivElement>(null);

  const displayMatches =
    historyTab === 'bet' ? getBetHistoryMatches() : getParticipatedMatches();

  const handleHistoryTabChange = (tab: HistoryBottomTab) => {
    setHistoryTab(tab);
    setOpenMatchId(null);
    setExpandedRoundId(null);
  };

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
  }, [openMatchId, expandedRoundId, historyTab, updateMatchesScrollState]);

  const handleToggleMatch = (matchId: string) => {
    setOpenMatchId((current) => (current === matchId ? null : matchId));
    setExpandedRoundId(null);
  };

  if (view === 'receipt') {
    return <ViewReceipt onBack={() => setView('history')} onClose={() => setView('history')} />;
  }

  return (
    <div className={styles.variantScreen}>
      <HistoryHeader onClose={() => undefined} />
      <div className={`${styles.content} ${styles.contentWithBottomTabs}`}>
        <div ref={matchesRef} className={styles.matches}>
          {displayMatches.map((match, index) => (
            <MatchCard
              key={match.id}
              match={match}
              isOpen={openMatchId === match.id}
              hasPeekBelow={index < displayMatches.length - 1}
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
          className={`${styles.fadeBottom} ${styles.fadeBottomWithTabs} ${matchesScrollState.atBottom ? styles.fadeHidden : ''}`}
          aria-hidden="true"
        />
      </div>
      <HistoryBottomTabs activeTab={historyTab} onChange={handleHistoryTabChange} />
    </div>
  );
}

void HistoryScreenV1;

export function HistoryScreen() {
  const [variant, setVariant] = useState<HistoryVariant>('v3');

  return (
    <div className={styles.app}>
      <div className={styles.wrapper}>
        <VariantTabs variant={variant} onChange={setVariant} />
        <div className={styles.container}>
          <div className={styles.screen}>
            {/* {variant === 'v1' ? <HistoryScreenV1 /> : null} */}
            {variant === 'v2' ? (
              <HistoryScreenV2 />
            ) : variant === 'v3' ? (
              <HistoryScreenV3 />
            ) : (
              <HistoryScreenV4 />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
