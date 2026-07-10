import type { MatchItem, RoundItem } from '../data/historyData';
import { RoundRowV3 } from './RoundRowV3';
import styles from './MatchGroupV3.module.css';

type MatchGroupV3Props = {
  match: MatchItem;
  dateLabel: string;
  rounds: RoundItem[];
  firstVisibleRoundId: string | null;
  onSelectRound: (matchId: string, roundId: string) => void;
};

export function MatchGroupV3({
  match,
  dateLabel,
  rounds,
  firstVisibleRoundId,
  onSelectRound,
}: MatchGroupV3Props) {
  return (
    <section className={styles.group}>
      <div className={styles.header}>
        <span className={styles.matchId}>Match ID:{match.matchId.slice(0, 6)}</span>
        <span className={styles.dateLabel}>{dateLabel}</span>
      </div>
      <div className={styles.rounds}>
        {rounds.map((round, index) => (
          <RoundRowV3
            key={round.id}
            round={round}
            hideTopLine={round.id === firstVisibleRoundId}
            hideBottomLine={index === rounds.length - 1}
            onSelect={() => onSelectRound(match.id, round.id)}
          />
        ))}
      </div>
    </section>
  );
}
