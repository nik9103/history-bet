import type { MatchItem, RoundItem } from '../data/historyData';
import { RoundItemV2 } from './RoundItemV2';
import styles from './MatchGroupV3.module.css';

type MatchGroupV4Props = {
  match: MatchItem;
  dateLabel: string;
  rounds: RoundItem[];
  firstVisibleRoundId: string | null;
  expandedRoundId: string | null;
  onToggleRound: (roundId: string) => void;
  onViewReceipt: () => void;
};

export function MatchGroupV4({
  match,
  dateLabel,
  rounds,
  firstVisibleRoundId,
  expandedRoundId,
  onToggleRound,
  onViewReceipt,
}: MatchGroupV4Props) {
  return (
    <section className={styles.group}>
      <div className={styles.header}>
        <span className={styles.matchId}>Match ID:{match.matchId.slice(0, 6)}</span>
        <span className={styles.dateLabel}>{dateLabel}</span>
      </div>
      <div className={styles.rounds}>
        {rounds.map((round, index) => (
          <RoundItemV2
            key={round.id}
            round={round}
            hideTopLine={round.id === firstVisibleRoundId}
            hideBottomLine={index === rounds.length - 1}
            expanded={expandedRoundId === round.id}
            onToggleExpand={() => onToggleRound(round.id)}
            onViewReceipt={onViewReceipt}
          />
        ))}
      </div>
    </section>
  );
}
