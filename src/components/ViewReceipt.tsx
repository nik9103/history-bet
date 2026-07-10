import { receiptBets } from '../data/historyData';
import { HistoryHeader } from './HistoryHeader';
import { BetIcon } from './icons/DiceIcon';
import { MarketIcon } from './icons/MarketIcon';
import styles from './ViewReceipt.module.css';

type ViewReceiptProps = {
  onBack: () => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  comboTitle?: string;
  roundIdLabel?: string;
};

export function ViewReceipt({
  onBack,
  onClose,
  title = 'Match 24 | Throw 31',
  subtitle = '2026 Jan 12, 14:56 | Nards Combo',
  comboTitle = 'Combo: 24',
  roundIdLabel = 'Round ID: jfk473jsyeK',
}: ViewReceiptProps) {
  return (
    <div className={styles.receipt}>
      <HistoryHeader
        mode="receipt"
        title={title}
        subtitle={subtitle}
        onBack={onBack}
        onClose={onClose}
      />

      <div className={styles.content}>
        <div className={styles.hero}>
          <MarketIcon size="lg" />
          <h2 className={styles.comboTitle}>{comboTitle}</h2>
          <p className={styles.roundId}>{roundIdLabel}</p>
        </div>

        <div className={styles.bets}>
          {receiptBets.map((bet) => (
            <section key={bet.id} className={styles.betBlock}>
              <div className={styles.betHeader}>
                <div className={styles.betTitle}>
                  <BetIcon type={bet.icon} />
                  <span>{bet.title}</span>
                </div>
                <div className={styles.betPayout}>
                  <span className={styles.multiplier}>{bet.multiplier}</span>
                  <span>{bet.payout}</span>
                </div>
              </div>

              <div className={styles.sections}>
                {bet.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className={styles.section}>
                    <div className={styles.divider} />
                    {section.map((row) => (
                      <div key={row.label} className={styles.row}>
                        <span>{row.label}</span>
                        <span>{row.value}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
