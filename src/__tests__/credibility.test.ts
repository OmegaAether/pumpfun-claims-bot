/**
 * Tests for the credibility scoring engine.
 *
 * The score is deterministic, so every case pins concrete expectations.
 * `now` is injected everywhere account-age math is involved so the tests
 * never depend on the wall clock.
 */

import { describe, it, expect } from 'vitest';
import { scoreCredibility, TIER_META, tierFor, type CredibilityInput } from '../credibility.js';
import { makeGitHubUser, makeGitHubRepo, makeClaimFeedContext } from './fixtures.js';

// Fixed reference clock: 2026-07-17T00:00:00Z
const NOW = Date.UTC(2026, 6, 17);

function input(overrides: Partial<CredibilityInput> = {}): CredibilityInput {
    return { now: NOW, ...overrides };
}

describe('scoreCredibility', () => {
    it('returns a neutral-ish baseline with no signals', () => {
        const r = scoreCredibility(input());
        expect(r.score).toBe(50);
        expect(r.tier).toBe('caution');
        expect(r.factors).toEqual([]);
    });

    it('scores a verified, aged, prolific dev with a starred repo as strong', () => {
        const r = scoreCredibility(
            input({
                githubUser: makeGitHubUser({
                    login: 'realdev',
                    createdAt: '2013-01-01T00:00:00Z', // ~13y
                    publicRepos: 66,
                    followers: 1200,
                }),
                repoInfo: makeGitHubRepo({ stars: 800, isFork: false }),
                tokenInfo: { githubUrls: ['https://github.com/realdev/project'] } as never,
            }),
        );
        expect(r.tier).toBe('strong');
        expect(r.score).toBeGreaterThanOrEqual(75);
        expect(r.factors[0]).toEqual({ label: 'claim verified', delta: 22 });
    });

    it('scores a fresh throwaway with a mismatched fork copycat as high-risk', () => {
        const r = scoreCredibility(
            input({
                githubUser: makeGitHubUser({
                    login: 'scammer',
                    createdAt: '2026-07-10T00:00:00Z', // 7 days old
                    publicRepos: 0,
                    followers: 0,
                    bio: null,
                    company: null,
                    blog: null,
                    hireable: false,
                }),
                repoInfo: makeGitHubRepo({ stars: 0, isFork: true }),
                tokenInfo: {
                    usdMarketCap: 4_000,
                    isNsfw: false,
                    isBanned: false,
                    githubUrls: ['https://github.com/someoneelse/famous-repo'],
                } as never,
                sameNameTokens: [
                    { mint: 'X', name: 'Fam', symbol: 'FAM', usdMarketCap: 4_000_000, url: '', age: '1y' },
                ],
                bundle: { bundlePct: 35, bundleWallets: 12 },
                holders: { totalHolders: 10, topHolders: [], top10Pct: 72 },
            }),
        );
        expect(r.tier).toBe('high-risk');
        expect(r.score).toBeLessThan(35);
        const labels = r.factors.map(f => f.label);
        expect(labels).toContain('new account (7d)');
        expect(labels.some(l => l.startsWith('GitHub mismatch'))).toBe(true);
        expect(labels.some(l => l.startsWith('copycat'))).toBe(true);
    });

    it('clamps to the [0, 100] range', () => {
        const floor = scoreCredibility(
            input({
                githubUser: makeGitHubUser({ createdAt: '2026-07-16T00:00:00Z', publicRepos: 0, followers: 0, bio: null, company: null, blog: null, hireable: false }),
                tokenInfo: { isBanned: true, usdMarketCap: 100, githubUrls: [] } as never,
                creatorProfile: { scamEstimate: 9, totalLaunches: 50 } as never,
                sameNameTokens: [{ mint: 'X', name: 'x', symbol: 'X', usdMarketCap: 9_000_000, url: '', age: '2y' }],
                bundle: { bundlePct: 90, bundleWallets: 40 },
                holders: { totalHolders: 3, topHolders: [], top10Pct: 99 },
            }),
        );
        expect(floor.score).toBe(0);
    });

    it('penalises a claim whose GitHub owner does not match the claimer', () => {
        const r = scoreCredibility(
            input({
                githubUser: makeGitHubUser({ login: 'claimer' }),
                tokenInfo: { usdMarketCap: 50_000, githubUrls: ['https://github.com/someoneelse/repo'] } as never,
            }),
        );
        expect(r.factors.some(f => f.label.startsWith('GitHub mismatch') && f.delta === -20)).toBe(true);
    });

    it('rewards a matching claim as verified (case-insensitive)', () => {
        const r = scoreCredibility(
            input({
                githubUser: makeGitHubUser({ login: 'Claimer' }),
                tokenInfo: { usdMarketCap: 50_000, githubUrls: ['https://github.com/claimer/repo'] } as never,
            }),
        );
        expect(r.factors.some(f => f.label === 'claim verified' && f.delta === 22)).toBe(true);
    });

    it('sorts factors by magnitude, largest first', () => {
        const r = scoreCredibility(
            input({
                githubUser: makeGitHubUser({ createdAt: '2013-01-01T00:00:00Z', publicRepos: 5, followers: 25 }),
                tokenInfo: { usdMarketCap: 50_000, githubUrls: ['https://github.com/testdev/x'] } as never,
            }),
        );
        for (let i = 1; i < r.factors.length; i++) {
            expect(Math.abs(r.factors[i - 1]!.delta)).toBeGreaterThanOrEqual(Math.abs(r.factors[i]!.delta));
        }
    });

    it('works end-to-end on the standard fixture context', () => {
        const ctx = makeClaimFeedContext();
        const r = scoreCredibility({ ...ctx, now: NOW });
        expect(r.score).toBeGreaterThan(0);
        expect(r.score).toBeLessThanOrEqual(100);
        expect(TIER_META[r.tier]).toBeDefined();
    });

    it('maps scores to tiers at the documented boundaries', () => {
        expect(tierFor(75)).toBe('strong');
        expect(tierFor(74)).toBe('moderate');
        expect(tierFor(55)).toBe('moderate');
        expect(tierFor(54)).toBe('caution');
        expect(tierFor(35)).toBe('caution');
        expect(tierFor(34)).toBe('high-risk');
    });

    it('every tier has display metadata', () => {
        for (const tier of ['strong', 'moderate', 'caution', 'high-risk'] as const) {
            expect(TIER_META[tier].emoji).toBeTruthy();
            expect(TIER_META[tier].label).toBeTruthy();
        }
    });
});
