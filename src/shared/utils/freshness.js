/**
 * @file src/utils/freshness.js
 * @description Logic for calculating coffee freshness state based on roast date.
 */

export const FRESHNESS = {
    RESTING: 'resting',
    PEAK: 'peak',
    GOOD: 'good',
    OLD: 'old'
};

export function calculateFreshness(roastDateString) {
    if (!roastDateString) return null;

    const roastDate = new Date(roastDateString);
    const today = new Date();

    // Calculate difference in days
    const diffTime = Math.abs(today - roastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
        return {
            state: FRESHNESS.RESTING,
            label: 'Resting',
            daysOld: diffDays,
            description: 'Zbyt świeża. Odczekaj chwilę.'
        };
    } else if (diffDays <= 30) {
        return {
            state: FRESHNESS.PEAK,
            label: 'Peak Flavor',
            daysOld: diffDays,
            description: 'Idealny czas na parzenie!'
        };
    } else if (diffDays <= 60) {
        return {
            state: FRESHNESS.GOOD,
            label: 'Still Good',
            daysOld: diffDays,
            description: 'Wciąż smaczna, ale aromaty ulatują.'
        };
    } else {
        return {
            state: FRESHNESS.OLD,
            label: 'Past Best',
            daysOld: diffDays,
            description: 'Najlepsze do Cold Brew.'
        };
    }
}
