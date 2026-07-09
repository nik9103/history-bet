import type { ReactNode } from 'react';
import styles from './DiceIcon.module.css';

type DiceVariant = 'blue-2' | 'red-3' | 'red-5' | 'red-3-small';

const DICE_DOTS: Record<DiceVariant, ReactNode> = {
  'blue-2': (
    <>
      <span className={styles.dot} style={{ left: 9, top: 0 }} />
      <span className={styles.dot} style={{ left: 0, top: 9 }} />
    </>
  ),
  'red-3': (
    <>
      <span className={styles.dot} style={{ left: 6, top: 0 }} />
      <span className={styles.dot} style={{ left: 3, top: 3 }} />
      <span className={styles.dot} style={{ left: 0, top: 6 }} />
    </>
  ),
  'red-5': (
    <>
      <span className={styles.dot} style={{ left: 9, top: 9 }} />
      <span className={styles.dot} style={{ left: 9, top: 0 }} />
      <span className={styles.dot} style={{ left: 0, top: 0 }} />
      <span className={styles.dot} style={{ left: 0, top: 9 }} />
      <span className={styles.dot} style={{ left: 4.5, top: 4.5 }} />
    </>
  ),
  'red-3-small': (
    <>
      <span className={styles.dotSmall} style={{ left: 5.14, top: 0 }} />
      <span className={styles.dotSmall} style={{ left: 2.57, top: 2.57 }} />
      <span className={styles.dotSmall} style={{ left: 0, top: 5.14 }} />
    </>
  ),
};

type DiceIconProps = {
  variant: DiceVariant;
  size?: 12 | 8;
};

export function DiceIcon({ variant, size = 12 }: DiceIconProps) {
  const color = variant.startsWith('blue') ? 'var(--color-blue-500)' : 'var(--color-red-500)';
  const dotColor = variant.startsWith('blue') ? 'var(--color-blue-900)' : 'var(--color-red-900)';

  return (
    <span
      className={styles.dice}
      style={{
        width: size,
        height: size,
        background: color,
        ['--dot-color' as string]: dotColor,
      }}
    >
      {DICE_DOTS[variant]}
    </span>
  );
}

type BetIconProps = {
  type: 'blue' | 'red' | 'red-5' | 'draw' | 'any-red';
};

export function BetIcon({ type }: BetIconProps) {
  if (type === 'draw') {
    return (
      <span className={styles.drawIcon}>
        <span>D</span>
      </span>
    );
  }

  if (type === 'any-red') {
    return (
      <span className={styles.anyRedIcon}>
        <span>a</span>
      </span>
    );
  }

  if (type === 'blue') {
    return (
      <span className={styles.betIconBlue}>
        <DiceIcon variant="blue-2" />
      </span>
    );
  }

  if (type === 'red') {
    return (
      <span className={styles.betIconRed}>
        <DiceIcon variant="red-3-small" size={8} />
      </span>
    );
  }

  if (type === 'red-5') {
    return (
      <span className={styles.betIconRed}>
        <DiceIcon variant="red-5" />
      </span>
    );
  }

  return (
    <span className={styles.betIconRed}>
      <DiceIcon variant="red-5" />
    </span>
  );
}
