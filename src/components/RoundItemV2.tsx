import { useCallback, useEffect, useRef, useState } from 'react';
import type { RoundItem as RoundItemType } from '../data/historyData';
import { TimelineMarker } from './TimelineMarker';
import { MarketIcon } from './icons/MarketIcon';
import { ChevronIcon, ReceiptIcon, RewatchIcon } from './icons/Icons';
import { AmountDisplay } from './AmountDisplay';
import { BetRow } from './BetRow';
import styles from './RoundItemV2.module.css';

type RoundItemV2Props = {
  round: RoundItemType;
  hideTopLine: boolean;
  hideBottomLine: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onViewReceipt?: () => void;
};

type BetsScrollState = {
  atBottom: boolean;
  hasOverflow: boolean;
};

export function RoundItemV2({
  round,
  hideTopLine,
  hideBottomLine,
  expanded,
  onToggleExpand,
  onViewReceipt,
}: RoundItemV2Props) {
  const [hovered, setHovered] = useState(false);
  const [betsScrollState, setBetsScrollState] = useState<BetsScrollState>({
    atBottom: true,
    hasOverflow: false,
  });
  const betsListRef = useRef<HTMLDivElement>(null);
  const isExpandable = Boolean(round.bets?.length);

  const updateBetsScrollState = useCallback(() => {
    const list = betsListRef.current;
    if (!list) return;

    const hasOverflow = list.scrollHeight > list.clientHeight + 1;
    const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 1;

    setBetsScrollState({ atBottom, hasOverflow });
  }, []);

  useEffect(() => {
    const list = betsListRef.current;
    if (!expanded || !list) return;

    const handleScroll = () => updateBetsScrollState();
    list.addEventListener('scroll', handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => updateBetsScrollState());
    resizeObserver.observe(list);

    const frame = requestAnimationFrame(updateBetsScrollState);

    return () => {
      cancelAnimationFrame(frame);
      list.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [expanded, round.bets, updateBetsScrollState]);

  const showBetsFadeBottom = betsScrollState.hasOverflow && !betsScrollState.atBottom;

  const handleRowClick = () => {
    if (isExpandable) onToggleExpand();
  };

  const handleChevronClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleExpand();
  };

  return (
    <div className={styles.wrap} data-round-id={round.id}>
      <div
        className={`${styles.row} ${hovered && isExpandable && !expanded ? styles.rowHovered : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <TimelineMarker
          number={round.number}
          hideTopLine={hideTopLine}
          hideBottomLine={hideBottomLine}
        />
        <div
          className={`${styles.body} ${isExpandable ? styles.bodyExpandable : ''}`}
          onClick={handleRowClick}
          onKeyDown={(event) => {
            if (!isExpandable) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onToggleExpand();
            }
          }}
          role={isExpandable ? 'button' : undefined}
          tabIndex={isExpandable ? 0 : undefined}
        >
          <div className={styles.left}>
            <span className={styles.iconWrap}>
              <MarketIcon loading={round.loading} />
            </span>
            <div className={styles.info}>
              <span className={styles.title}>{round.title}</span>
              <span className={styles.meta}>
                {round.time}
                {round.dealer && (
                  <>
                    <span className={styles.dot}> · </span>
                    {round.dealer}
                  </>
                )}
              </span>
            </div>
          </div>
          <div className={styles.right}>
            {round.amount && (
              <AmountDisplay
                amount={round.amount}
                subtitle={round.subtitle}
                positive={round.amountPositive}
                amountSize="caption"
              />
            )}
            {isExpandable && (
              <button
                type="button"
                className={`${styles.chevronBtn} ${expanded ? styles.chevronUp : ''}`}
                onClick={handleChevronClick}
                aria-label={expanded ? 'Collapse round' : 'Expand round'}
              >
                <ChevronIcon direction="down" />
              </button>
            )}
          </div>
        </div>
      </div>

      {isExpandable && (
        <div className={`${styles.expandedWrap} ${expanded ? styles.expandedOpen : ''}`}>
          <div className={styles.expandedInner}>
            <div className={styles.expanded}>
              <div className={styles.timelineLine} aria-hidden="true" />
              <div className={styles.betsPanel}>
                <div className={styles.panelHeader}>
                  <span className={styles.throwTitle}>Throw {round.number}</span>
                  <div className={styles.panelActions}>
                    <button type="button" className={styles.actionBtn}>
                      Rewatch
                      <RewatchIcon />
                    </button>
                    <button type="button" className={styles.actionBtn} onClick={onViewReceipt}>
                      View receipt
                      <ReceiptIcon />
                    </button>
                  </div>
                </div>
                <div className={styles.summary}>
                  <span>{round.guessedCount}</span>
                  <span>{round.balance}</span>
                </div>
                <div className={styles.betsScrollArea}>
                  <div ref={betsListRef} className={styles.betsList} data-bets-scroll="">
                    {round.bets?.map((bet) => (
                      <BetRow key={bet.id} bet={bet} />
                    ))}
                  </div>
                  <div
                    className={`${styles.fadeBottom} ${showBetsFadeBottom ? '' : styles.fadeHidden}`}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
