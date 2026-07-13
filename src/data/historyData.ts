export type BetResult = 'guess' | 'loss';
export type BetSettlementStatus = 'settled' | 'unsettled' | 'refund';
export type AmountVariant = 'positive' | 'negative' | 'refund';

export type BetItem = {
  id: string;
  title: string;
  multiplier: string;
  result: BetResult;
  settlement: BetSettlementStatus;
  amount: string;
  stake: string;
  icon: 'blue' | 'red-5' | 'draw';
};

export type RoundItem = {
  id: string;
  number: number;
  title: string;
  time: string;
  dealer: string;
  loading?: boolean;
  waiting?: boolean;
  amount?: string;
  amountPositive?: boolean;
  amountVariant?: AmountVariant;
  subtitle?: string;
  bets?: BetItem[];
  guessedCount?: string;
  balance?: string;
};

export type MatchSummary = {
  amount: string;
  amountPositive: boolean;
  subtitle: string;
};

export type RoundBetProfile = {
  roundNumber: number;
  guessed: number;
  total: number;
  net: number;
};

export type MatchItem = {
  id: string;
  title: string;
  date: string;
  matchId: string;
  active?: boolean;
  summary: MatchSummary | null;
  rounds: RoundItem[];
};

const ROUND_TITLES = [
  '1 Blue & 3 Red',
  '2 Blue & 2 Red',
  '3 Blue & 1 Red',
  '4 Red',
  'All Blue',
  '2 Red & 2 Blue',
  'Draw heavy',
  '1 Red & 3 Blue',
];

const DEALERS = ['Nadia B.', 'Alex K.', 'Maria S.', 'James T.', 'Elena R.', 'Oleg P.'];

const BET_TEMPLATES: Pick<BetItem, 'title' | 'icon' | 'multiplier'>[] = [
  { title: 'Exact blue: 2', icon: 'blue', multiplier: 'x2,25' },
  { title: 'Exact blue: 4', icon: 'blue', multiplier: 'x3,50' },
  { title: 'Exact blue: 6', icon: 'blue', multiplier: 'x4,00' },
  { title: 'Draw', icon: 'draw', multiplier: 'x2,25' },
  { title: 'Exact red: 3', icon: 'red-5', multiplier: 'x2,80' },
  { title: 'Exact red: 5', icon: 'red-5', multiplier: 'x2,25' },
  { title: 'Exact red: 6', icon: 'red-5', multiplier: 'x3,10' },
  { title: 'Any blue', icon: 'blue', multiplier: 'x1,85' },
  { title: 'Any red', icon: 'red-5', multiplier: 'x1,62' },
  { title: 'Blue wins', icon: 'blue', multiplier: 'x1,95' },
  { title: 'Red wins', icon: 'red-5', multiplier: 'x1,90' },
  { title: 'Exact blue: 1', icon: 'blue', multiplier: 'x5,50' },
];

const STAKES = [50, 75, 100, 125, 150, 200, 250, 300];

function createRng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function formatAmount(value: number, positive: boolean): string {
  const prefix = positive ? '+' : '-';
  const abs = Math.abs(value);
  return abs % 1 === 0 ? `${prefix}€${abs}` : `${prefix}€${abs.toFixed(1)}`;
}

function formatTime(rng: () => number, hour: number): string {
  const minute = Math.floor(rng() * 50) + 5;
  const endMinute = minute + 1 + Math.floor(rng() * 2);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hour)}:${pad(minute)}-${pad(hour)}:${pad(endMinute)}`;
}

function parseSignedAmount(amount: string): number {
  const match = amount.match(/([+-])€([\d.]+)/);
  if (!match) return 0;
  const value = Number(match[2]);
  return match[1] === '+' ? value : -value;
}

function shuffleInPlace<T>(items: T[], rng: () => number) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

function pickSettlementStatus(rng: () => number): BetSettlementStatus {
  const value = rng();
  if (value < 0.14) return 'refund';
  if (value < 0.28) return 'unsettled';
  return 'settled';
}

function buildSettlementPlan(count: number, rng: () => number): BetSettlementStatus[] {
  const plan = Array.from({ length: count }, () => pickSettlementStatus(rng));
  const settledCount = plan.filter((status) => status === 'settled').length;

  if (count > 1 && settledCount === 0) {
    plan[0] = 'settled';
  }

  shuffleInPlace(plan, rng);
  return plan;
}

function computeRoundSummary(bets: BetItem[]) {
  const refundBets = bets.filter((bet) => bet.settlement === 'refund');
  const settledBets = bets.filter((bet) => bet.settlement === 'settled');
  const refundCount = refundBets.length;
  const settledCount = settledBets.length;
  const guessed = settledBets.filter((bet) => bet.result === 'guess').length;

  if (refundCount > 0 && settledCount === 0) {
    const totalRefund = refundBets.reduce(
      (sum, bet) => sum + Math.max(0, parseSignedAmount(bet.amount)),
      0,
    );

    return {
      amount: formatAmount(totalRefund, true),
      amountPositive: true,
      amountVariant: 'refund' as const,
      subtitle: `Refund ${refundCount}`,
    };
  }

  const net = settledBets.reduce((sum, bet) => sum + parseSignedAmount(bet.amount), 0);
  let subtitle = `Guessed ${guessed} of ${settledCount}`;

  if (refundCount > 0) {
    subtitle += ` · Refund ${refundCount}`;
  }

  return {
    amount: formatAmount(Math.abs(net), net >= 0),
    amountPositive: net >= 0,
    amountVariant: (net > 0 ? 'positive' : 'negative') as AmountVariant,
    subtitle,
  };
}

function createBet(
  roundId: string,
  index: number,
  settlement: BetSettlementStatus,
  isGuess: boolean,
  value: number,
  rng: () => number,
): BetItem {
  const template = pick(rng, BET_TEMPLATES);
  const stake = pick(rng, STAKES);

  if (settlement === 'refund') {
    return {
      id: `${roundId}-bet-${index + 1}`,
      title: template.title,
      multiplier: template.multiplier,
      result: 'guess',
      settlement: 'refund',
      amount: formatAmount(stake, true),
      stake: `of €${stake}`,
      icon: template.icon,
    };
  }

  return {
    id: `${roundId}-bet-${index + 1}`,
    title: template.title,
    multiplier: template.multiplier,
    result: isGuess ? 'guess' : 'loss',
    settlement,
    amount: formatAmount(value, isGuess),
    stake: `of €${stake}`,
    icon: template.icon,
  };
}

function splitAmount(total: number, count: number): number[] {
  if (count === 0) return [];

  const absTotal = Math.max(0, Math.round(Math.abs(total)));
  const base = Math.floor(absTotal / count);
  const remainder = absTotal - base * count;

  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

function createBetsFromSummary(roundId: string, summary: MatchSummary, seed: number): BetItem[] {
  const guessedMatch = summary.subtitle.match(/Guessed (\d+) of (\d+)/);
  const guessed = guessedMatch ? Number(guessedMatch[1]) : 0;
  const total = guessedMatch ? Number(guessedMatch[2]) : 0;
  const amountMatch = summary.amount.match(/([+-])€([\d.]+)/);
  const targetNet = amountMatch
    ? (amountMatch[1] === '+' ? 1 : -1) * Number.parseFloat(amountMatch[2])
    : 0;
  const lossCount = total - guessed;
  const rng = createRng(seed);
  const baseStake = 50;

  let winTotal = 0;
  let lossTotal = 0;

  if (lossCount === 0) {
    winTotal = targetNet;
  } else if (guessed === 0) {
    lossTotal = Math.abs(targetNet);
  } else if (targetNet < 0) {
    winTotal = baseStake * guessed;
    lossTotal = winTotal + Math.abs(targetNet);
  } else {
    lossTotal = baseStake * lossCount;
    winTotal = lossTotal + targetNet;
  }

  const winAmounts = splitAmount(winTotal, guessed);
  const lossAmounts = splitAmount(lossTotal, lossCount);
  const bets: BetItem[] = [];
  let index = 0;

  for (const amount of winAmounts) {
    bets.push(createBet(roundId, index, 'settled', true, amount, rng));
    index += 1;
  }

  for (const amount of lossAmounts) {
    bets.push(createBet(roundId, index, 'settled', false, amount, rng));
    index += 1;
  }

  return bets;
}

function applyRoundBets(round: RoundItem, bets: BetItem[], seed: number): RoundItem {
  const rng = createRng(seed);
  const summary = computeRoundSummary(bets);
  const settledBets = bets.filter((bet) => bet.settlement === 'settled');
  const guessed = settledBets.filter((bet) => bet.result === 'guess').length;
  const totalStake = bets.reduce((sum, bet) => {
    const match = bet.stake.match(/€(\d+)/);
    return sum + (match ? Number(match[1]) : 0);
  }, 0);
  const net = settledBets.reduce((sum, bet) => sum + parseSignedAmount(bet.amount), 0);

  return {
    ...round,
    amount: summary.amount,
    amountPositive: summary.amountPositive,
    amountVariant: summary.amountVariant,
    subtitle: summary.subtitle,
    guessedCount: `${guessed}/${settledBets.length} bets guessed`,
    balance: `Balance ${formatAmount(Math.abs(totalStake * 0.35 + rng() * 80), net >= 0)}`,
    bets,
  };
}

function buildMatchSummary(rounds: RoundItem[]): MatchSummary | null {
  const roundsWithBets = rounds.filter((round) => round.bets?.length);
  if (!roundsWithBets.length) return null;

  let net = 0;
  let guessed = 0;
  let total = 0;

  for (const round of roundsWithBets) {
    for (const bet of round.bets ?? []) {
      total += 1;
      if (bet.result === 'guess') guessed += 1;

      const match = bet.amount.match(/([+-])€([\d.]+)/);
      if (match) {
        const value = Number(match[2]);
        net += match[1] === '+' ? value : -value;
      }
    }
  }

  if (total === 0) return null;

  const amountPositive = net >= 0;
  return {
    amount: formatAmount(Math.abs(net), amountPositive),
    amountPositive,
    subtitle: `Guessed ${guessed} of ${total}`,
  };
}

function createBets(roundId: string, count: number, seed: number): BetItem[] {
  const rng = createRng(seed);
  const settlementPlan = buildSettlementPlan(count, rng);
  const settledCount = settlementPlan.filter((status) => status === 'settled').length;
  const guessedCount = Math.max(0, Math.min(settledCount, Math.round(settledCount * (0.35 + rng() * 0.45))));
  const lossCount = settledCount - guessedCount;
  const baseStake = 50;
  const winTotal = guessedCount > 0 ? baseStake * guessedCount * (1.2 + rng() * 0.8) : 0;
  const lossTotal = lossCount > 0 ? baseStake * lossCount * (0.8 + rng() * 0.4) : 0;
  const winAmounts = splitAmount(Math.round(winTotal), guessedCount);
  const lossAmounts = splitAmount(Math.round(lossTotal), lossCount);
  const bets: BetItem[] = [];
  let winIndex = 0;
  let lossIndex = 0;

  settlementPlan.forEach((settlement, index) => {
    if (settlement === 'refund') {
      bets.push(createBet(roundId, index, 'refund', false, 0, rng));
      return;
    }

    if (settlement === 'unsettled') {
      const isGuess = rng() > 0.42;
      const stake = pick(rng, STAKES);
      const multiplierValue = Number.parseFloat(
        pick(rng, BET_TEMPLATES).multiplier.slice(1).replace(',', '.'),
      );
      const value = isGuess
        ? Math.round(stake * multiplierValue)
        : Math.round(stake * (0.8 + rng() * 0.4));

      bets.push(createBet(roundId, index, 'unsettled', isGuess, value, rng));
      return;
    }

    if (winIndex < winAmounts.length) {
      bets.push(createBet(roundId, index, 'settled', true, winAmounts[winIndex], rng));
      winIndex += 1;
      return;
    }

    bets.push(createBet(roundId, index, 'settled', false, lossAmounts[lossIndex] ?? baseStake, rng));
    lossIndex += 1;
  });

  return bets;
}

function createCompletedRound(
  roundId: string,
  number: number,
  seed: number,
  options?: { allowBets?: boolean },
): RoundItem {
  const rng = createRng(seed);
  const baseRound: RoundItem = {
    id: roundId,
    number,
    title: pick(rng, ROUND_TITLES),
    time: formatTime(rng, 13 + (number % 5)),
    dealer: pick(rng, DEALERS),
  };

  if (options?.allowBets === false) {
    return baseRound;
  }

  const hasBets = rng() > 0.58;
  if (!hasBets) {
    return baseRound;
  }

  const betCount = [2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 14, 15][Math.floor(rng() * 12)];
  const bets = createBets(roundId, betCount, seed + 17);

  return applyRoundBets(baseRound, bets, seed + 29);
}

function createMatchRounds(
  matchNumber: number,
  roundCount: number,
  options?: { includeOngoing?: boolean; allowBets?: boolean },
): RoundItem[] {
  const rounds: RoundItem[] = [];
  const latestRound = roundCount;

  if (options?.includeOngoing) {
    const ongoingSeed = matchNumber * 1000 + latestRound * 13;
    const ongoingRng = createRng(ongoingSeed);

    rounds.push({
      id: `m${matchNumber}-round-${latestRound}`,
      number: latestRound,
      title: 'Waiting for results',
      time: 'Ongoing',
      dealer: pick(ongoingRng, DEALERS),
      loading: true,
      waiting: true,
    });
  }

  const completedCount = options?.includeOngoing ? roundCount - 1 : roundCount;

  for (let i = 0; i < completedCount; i += 1) {
    const number = latestRound - (options?.includeOngoing ? 1 : 0) - i;
    const roundId = `m${matchNumber}-round-${number}`;
    const seed = matchNumber * 1000 + number * 13 + i * 7;

    rounds.push(
      createCompletedRound(roundId, number, seed, { allowBets: options?.allowBets }),
    );
  }

  return rounds;
}

function createBetsFromProfile(
  roundId: string,
  profile: Pick<RoundBetProfile, 'guessed' | 'total' | 'net'>,
  seed: number,
): BetItem[] {
  const summary: MatchSummary = {
    amount: formatAmount(Math.abs(profile.net), profile.net >= 0),
    amountPositive: profile.net >= 0,
    subtitle: `Guessed ${profile.guessed} of ${profile.total}`,
  };

  return createBetsFromSummary(roundId, summary, seed);
}

function selectSparseRoundNumbers(
  roundNumbers: number[],
  count: number,
  seed: number,
): number[] {
  const sorted = [...roundNumbers].sort((a, b) => b - a);
  if (count >= sorted.length) return sorted;

  const rng = createRng(seed);
  const selected = new Set<number>();
  const step = sorted.length / count;

  for (let i = 0; i < count; i += 1) {
    const baseIndex = Math.floor(i * step);
    const jitter = Math.floor(rng() * Math.max(1, Math.floor(step)));
    const index = Math.min(sorted.length - 1, baseIndex + jitter);
    selected.add(sorted[index]);
  }

  let fallbackIndex = 0;
  while (selected.size < count && fallbackIndex < sorted.length) {
    selected.add(sorted[fallbackIndex]);
    fallbackIndex += 1;
  }

  return [...selected].sort((a, b) => b - a);
}

function splitGuessedAcrossRounds(
  guessedTotal: number,
  betCounts: number[],
): number[] {
  const guessedCounts = betCounts.map(() => 0);
  let remaining = guessedTotal;

  for (let index = 0; index < betCounts.length && remaining > 0; index += 1) {
    const maxForRound = betCounts[index];
    const share = Math.min(maxForRound, Math.ceil(remaining / (betCounts.length - index)));
    guessedCounts[index] = share;
    remaining -= share;
  }

  return guessedCounts;
}

function splitNetAcrossRounds(
  targetNet: number,
  betCounts: number[],
  seed: number,
): number[] {
  const rng = createRng(seed);
  const roundCount = betCounts.length;
  if (roundCount === 0) return [];

  if (roundCount === 1) {
    return [targetNet];
  }

  const nets = Array.from({ length: roundCount }, () => 0);
  let remaining = targetNet;

  for (let index = 0; index < roundCount - 1; index += 1) {
    const maxAbs = Math.max(
      20,
      Math.min(Math.abs(remaining), 80 + Math.floor(rng() * 120)),
    );
    const sign = remaining === 0 ? (rng() > 0.5 ? 1 : -1) : Math.sign(remaining);
    const value = Math.min(Math.abs(remaining), maxAbs) * sign;
    nets[index] = value;
    remaining -= value;
  }

  nets[roundCount - 1] = remaining;
  return nets;
}

function generateSparseRoundBets(
  summary: MatchSummary,
  completedRoundNumbers: number[],
  seed: number,
): RoundBetProfile[] {
  const guessedMatch = summary.subtitle.match(/Guessed (\d+) of (\d+)/);
  const guessedTotal = guessedMatch ? Number(guessedMatch[1]) : 0;
  const betsTotal = guessedMatch ? Number(guessedMatch[2]) : 0;
  const amountMatch = summary.amount.match(/([+-])€([\d.]+)/);
  const targetNet = amountMatch
    ? (amountMatch[1] === '+' ? 1 : -1) * Number.parseFloat(amountMatch[2])
    : 0;

  const rng = createRng(seed);
  const maxRounds = Math.min(
    betsTotal,
    Math.max(2, Math.floor(completedRoundNumbers.length * (0.2 + rng() * 0.2))),
  );
  const minRounds = Math.max(1, Math.min(maxRounds, Math.ceil(betsTotal / 4)));
  const roundCount = minRounds + Math.floor(rng() * (maxRounds - minRounds + 1));
  const selectedNumbers = selectSparseRoundNumbers(
    completedRoundNumbers,
    roundCount,
    seed + 11,
  );
  const betCounts = splitAmount(betsTotal, selectedNumbers.length);
  const guessedCounts = splitGuessedAcrossRounds(guessedTotal, betCounts);
  const nets = splitNetAcrossRounds(targetNet, betCounts, seed + 23);

  return selectedNumbers.map((roundNumber, index) => ({
    roundNumber,
    guessed: guessedCounts[index],
    total: betCounts[index],
    net: nets[index],
  }));
}

function applyRoundBetProfiles(
  rounds: RoundItem[],
  profiles: RoundBetProfile[],
  seed: number,
): RoundItem[] {
  const profileMap = new Map(profiles.map((profile) => [profile.roundNumber, profile]));

  return rounds.map((round, index) => {
    const profile = profileMap.get(round.number);
    if (!profile || round.loading || round.waiting) return round;

    const bets = createBetsFromProfile(round.id, profile, seed + index * 17);
    return applyRoundBets(round, bets, seed + index * 29);
  });
}

function applyRoundRefundScenario(
  round: RoundItem,
  scenario: 'partial-win' | 'partial-loss' | 'full-refund',
  refundCount: number,
  seed: number,
): RoundItem {
  if (round.loading || round.waiting) return round;

  const rng = createRng(seed);

  if (scenario === 'full-refund') {
    const refundBets = Array.from({ length: refundCount }, (_, index) =>
      createBet(round.id, index, 'refund', false, 0, rng),
    );
    return applyRoundBets(round, refundBets, seed);
  }

  const settledBets = (round.bets ?? []).filter((bet) => bet.settlement === 'settled');
  if (!settledBets.length) return round;

  const refundBets = Array.from({ length: refundCount }, (_, index) =>
    createBet(round.id, settledBets.length + index, 'refund', false, 0, rng),
  );

  return applyRoundBets(round, [...settledBets, ...refundBets], seed);
}

function injectRefundDemoRounds(match: MatchItem): MatchItem {
  const refundRoundNumbers: Record<number, { scenario: 'partial-win' | 'partial-loss' | 'full-refund'; refundCount: number }> = {
    21: { scenario: 'partial-win', refundCount: 2 },
    20: { scenario: 'partial-loss', refundCount: 2 },
    17: { scenario: 'full-refund', refundCount: 1 },
    16: { scenario: 'partial-win', refundCount: 1 },
    12: { scenario: 'full-refund', refundCount: 2 },
  };

  const rounds = match.rounds.map((round) => {
    const demo = refundRoundNumbers[round.number];
    if (!demo || !round.bets?.length) return round;

    return applyRoundRefundScenario(
      round,
      demo.scenario,
      demo.refundCount,
      Number.parseInt(match.id.replace(/\D/g, ''), 10) * 100 + round.number,
    );
  });

  return {
    ...match,
    rounds,
    summary: match.summary ? buildMatchSummary(rounds) : null,
  };
}

function createMatch(
  number: number,
  date: string,
  matchId: string,
  roundCount: number,
  options?: {
    active?: boolean;
    participated?: boolean;
    summary?: MatchSummary;
    roundBets?: RoundBetProfile[];
  },
): MatchItem {
  const participated = options?.participated ?? true;
  let rounds = createMatchRounds(number, roundCount, {
    includeOngoing: options?.active,
    allowBets: false,
  });

  if (participated && options?.summary) {
    const completedRoundNumbers = rounds
      .filter((round) => !round.loading && !round.waiting)
      .map((round) => round.number);
    const profiles =
      options.roundBets ??
      generateSparseRoundBets(options.summary, completedRoundNumbers, number * 1000 + 97);

    rounds = applyRoundBetProfiles(rounds, profiles, number * 1000 + 97);
  } else if (participated) {
    rounds = createMatchRounds(number, roundCount, {
      includeOngoing: options?.active,
      allowBets: true,
    });
  }

  return {
    id: `match-${number}`,
    title: `Match №${number}`,
    date,
    matchId,
    active: options?.active,
    summary: participated ? buildMatchSummary(rounds) : null,
    rounds,
  };
}

export type ReceiptBet = {
  id: string;
  title: string;
  multiplier: string;
  payout: string;
  icon: 'any-red' | 'red';
  sections: {
    label: string;
    value: string;
  }[][];
};

export const matches: MatchItem[] = [
  injectRefundDemoRounds(
    createMatch(24, '12 Jan', '1234567', 22, {
      active: true,
      participated: true,
      summary: { amount: '+€110', amountPositive: true, subtitle: 'Guessed 7 of 8' },
      roundBets: [
        { roundNumber: 21, guessed: 11, total: 15, net: 420 },
        { roundNumber: 20, guessed: 1, total: 2, net: -30 },
        { roundNumber: 17, guessed: 9, total: 14, net: 310 },
        { roundNumber: 15, guessed: 2, total: 2, net: 40 },
      ],
    }),
  ),
  injectRefundDemoRounds(
    createMatch(23, '11 Jan', '1234566', 21, {
      participated: true,
      summary: { amount: '-€243', amountPositive: false, subtitle: 'Guessed 2 of 6' },
      roundBets: [
        { roundNumber: 19, guessed: 1, total: 2, net: -90 },
        { roundNumber: 16, guessed: 0, total: 2, net: -80 },
        { roundNumber: 12, guessed: 1, total: 2, net: -73 },
      ],
    }),
  ),
  createMatch(22, '10 Jan', '1234565', 18, { participated: false }),
  injectRefundDemoRounds(
    createMatch(21, '9 Jan', '1234564', 16, {
      participated: true,
      summary: { amount: '+€87', amountPositive: true, subtitle: 'Guessed 5 of 9' },
    }),
  ),
  createMatch(20, '8 Jan', '1234563', 14, {
    participated: true,
    summary: { amount: '-€56', amountPositive: false, subtitle: 'Guessed 1 of 4' },
  }),
  createMatch(19, '7 Jan', '1234562', 12, {
    participated: true,
    summary: { amount: '+€412', amountPositive: true, subtitle: 'Guessed 9 of 11' },
  }),
  createMatch(18, '6 Jan', '1234561', 10, { participated: false }),
  createMatch(17, '5 Jan', '1234560', 8, {
    participated: true,
    summary: { amount: '-€128', amountPositive: false, subtitle: 'Guessed 3 of 7' },
  }),
  createMatch(16, '4 Jan', '1234559', 6, {
    participated: true,
    summary: { amount: '+€34', amountPositive: true, subtitle: 'Guessed 4 of 6' },
  }),
  createMatch(15, '3 Jan', '1234558', 5, { participated: false }),
];

export type MatchRoundGroup = {
  match: MatchItem;
  dateLabel: string;
  rounds: RoundItem[];
};

const MATCH_DATE_LABELS = ['today', 'Yesterday', '2 days ago'];

export function getParticipatedMatches(): MatchItem[] {
  return matches.filter((match) => match.summary !== null);
}

export function getBetHistoryMatches(): MatchItem[] {
  return getParticipatedMatches()
    .map((match) => ({
      ...match,
      rounds: match.rounds.filter(isBetHistoryRound),
    }))
    .filter((match) => match.rounds.length > 0);
}

export function getResultHistoryRoundGroups(): MatchRoundGroup[] {
  return matches.map((match, index) => ({
    match,
    dateLabel: MATCH_DATE_LABELS[index] ?? match.date,
    rounds: match.rounds,
  }));
}

export function getParticipatedRoundGroups(): MatchRoundGroup[] {
  return matches
    .filter((match) => match.summary !== null)
    .map((match, index) => ({
      match,
      dateLabel: MATCH_DATE_LABELS[index] ?? match.date,
      rounds: match.rounds,
    }));
}

export function isBetHistoryRound(round: RoundItem): boolean {
  return Boolean(round.bets?.length && round.amount);
}

export function getBetHistoryRoundGroups(): MatchRoundGroup[] {
  return getParticipatedRoundGroups()
    .map((group) => ({
      ...group,
      rounds: group.rounds.filter(isBetHistoryRound),
    }))
    .filter((group) => group.rounds.length > 0);
}

export type BetFilter = 'all' | 'settled' | 'unsettled' | 'refund';

export type HistoryEmptyTab = 'bet' | 'result';

export function getHistoryEmptyStateContent(
  historyTab: HistoryEmptyTab,
  betFilter: BetFilter = 'all',
): { title: string; description: string } {
  if (historyTab === 'result') {
    return {
      title: 'No results',
      description: 'Completed rounds will appear here after you join a match',
    };
  }

  switch (betFilter) {
    case 'settled':
      return {
        title: 'No settled bets',
        description: 'There are no settled bets matching this filter',
      };
    case 'unsettled':
      return {
        title: 'No unsettled bets',
        description: 'All bets in your history are already settled or refunded',
      };
    case 'refund':
      return {
        title: 'No refunds',
        description: 'Refund rounds will appear here when a bet is returned',
      };
    default:
      return {
        title: 'No bets',
        description: 'Your betting history will appear here after you place your first bet',
      };
  }
}

function matchesBetFilter(bet: BetItem, filter: BetFilter): boolean {
  if (filter === 'all') return true;
  return bet.settlement === filter;
}

export function filterBetHistoryRoundGroups(
  groups: MatchRoundGroup[],
  filter: BetFilter,
): MatchRoundGroup[] {
  if (filter === 'all') return groups;

  return groups
    .map((group) => ({
      ...group,
      rounds: group.rounds.flatMap((round) => {
        const filteredBets = round.bets?.filter((bet) => matchesBetFilter(bet, filter));
        if (!filteredBets?.length || !isBetHistoryRound({ ...round, bets: filteredBets })) {
          return [];
        }

        const summary = computeRoundSummary(filteredBets);

        return [
          {
            ...round,
            amount: summary.amount,
            amountPositive: summary.amountPositive,
            amountVariant: summary.amountVariant,
            subtitle: summary.subtitle,
            bets: filteredBets,
          },
        ];
      }),
    }))
    .filter((group) => group.rounds.length > 0);
}

export function getBetAmountVariant(bet: BetItem): AmountVariant {
  if (bet.settlement === 'refund') return 'refund';
  return bet.amount.startsWith('+') ? 'positive' : 'negative';
}

export function resolveRoundAmountVariant(round: RoundItem): AmountVariant {
  if (round.amountVariant) return round.amountVariant;
  return round.amountPositive ? 'positive' : 'negative';
}

export function findRoundInMatches(matchId: string, roundId: string) {
  const match = matches.find((item) => item.id === matchId);
  if (!match) return null;

  const round = match.rounds.find((item) => item.id === roundId);
  if (!round) return null;

  return { match, round };
}

export function getBetReceiptSections(bet: BetItem) {
  const stakeValue = bet.stake.replace(/^of\s+/i, '');
  const prizeAmount = bet.amount.startsWith('+')
    ? `€${Math.round(parseInt(bet.stake.replace(/\D/g, ''), 10) * parseFloat(bet.multiplier.replace('x', '').replace(',', '.')))}`
    : '€0';

  return [
    [
      { label: 'Bet ID', value: 'jfk473jsyeK' },
      { label: 'Bet status', value: 'Conducted' },
      { label: 'Result', value: bet.settlement === 'refund' ? 'Refund' : bet.result === 'guess' ? 'Guess' : 'Loss' },
    ],
    [
      { label: 'Bet sum', value: stakeValue.replace('€', '€') },
      { label: '14% Bet tax', value: '€14' },
      { label: 'Bet including taxes', value: '€114' },
    ],
    [
      { label: 'Prize amount', value: prizeAmount },
      { label: '2% prize tax', value: '€3,24' },
      { label: 'Prize including taxes', value: '€158,76' },
    ],
  ];
}

export function formatThrowDetailTitle(match: MatchItem, round: RoundItem) {
  const matchNumber = match.title.replace(/[^\d]/g, '');
  return `Match ${matchNumber} | Throw ${round.number}`;
}

export function formatThrowDetailSubtitle(match: MatchItem, round: RoundItem) {
  const startTime = round.time.split('-')[0]?.trim() ?? '';
  return `2026 ${match.date}, ${startTime} | Nards Combo`;
}

export const receiptBets: ReceiptBet[] = [
  {
    id: 'receipt-1',
    title: 'Any red',
    multiplier: 'X1.62',
    payout: '€ 500',
    icon: 'any-red',
    sections: [
      [
        { label: 'Bet ID', value: 'jfk473jsyeK' },
        { label: 'Bet status', value: 'Conducted' },
        { label: 'Result', value: 'Guess' },
      ],
      [
        { label: 'Bet sum', value: '€100' },
        { label: '14% Bet tax', value: '€14' },
        { label: 'Bet including taxes', value: '€114' },
      ],
      [
        { label: 'Prize amount', value: '€162' },
        { label: '2% prize tax', value: '€3,24' },
        { label: 'Prize including taxes', value: '€158,76' },
      ],
    ],
  },
  {
    id: 'receipt-2',
    title: 'Exact Red: 3',
    multiplier: 'X1.62',
    payout: '€ 500',
    icon: 'red',
    sections: [
      [
        { label: 'Bet ID', value: 'jfk473jsyeK' },
        { label: 'Bet status', value: 'Conducted' },
        { label: 'Result', value: 'Guess' },
      ],
      [
        { label: 'Bet sum', value: '€100' },
        { label: '14% Bet tax', value: '€14' },
        { label: 'Bet including taxes', value: '€114' },
      ],
      [
        { label: 'Prize amount', value: '€162' },
        { label: '2% prize tax', value: '€3,24' },
        { label: 'Prize including taxes', value: '€158,76' },
      ],
    ],
  },
];
