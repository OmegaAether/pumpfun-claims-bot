/**
 * Tests for the persistent dev-reputation store.
 *
 * State is in-memory here (DATA_DIR writes are debounced and harmless in
 * tests); `_resetDevReputation` clears between cases so they don't bleed.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    getReputation,
    recordClaim,
    _resetDevReputation,
    type DevReputation,
} from '../dev-reputation.js';

beforeEach(() => _resetDevReputation());

describe('dev-reputation', () => {
    it('returns null for a dev never seen before', () => {
        expect(getReputation('123', 'mintA')).toBeNull();
    });

    it('returns null when the only record is the current mint (no prior history)', () => {
        recordClaim('123', 'mintA', 80);
        // Looking up while on mintA — it is excluded, so no *prior* tokens.
        expect(getReputation('123', 'mintA')).toBeNull();
    });

    it('builds a track record across multiple tokens', () => {
        recordClaim('123', 'mintA', 20);
        recordClaim('123', 'mintB', 30);
        recordClaim('123', 'mintC', 10);
        // On a fourth token, prior = A,B,C → avg 20 → high-risk.
        const rep = getReputation('123', 'mintD') as DevReputation;
        expect(rep).not.toBeNull();
        expect(rep.priorTokens).toBe(3);
        expect(rep.avgScore).toBe(20);
        expect(rep.tier).toBe('high-risk');
        expect(rep.best).toBe(30);
        expect(rep.worst).toBe(10);
    });

    it('excludes the current mint from the prior average', () => {
        recordClaim('123', 'mintA', 10);
        recordClaim('123', 'mintB', 90);
        // Viewing mintB: only mintA counts as prior.
        const rep = getReputation('123', 'mintB') as DevReputation;
        expect(rep.priorTokens).toBe(1);
        expect(rep.avgScore).toBe(10);
    });

    it('dedupes a re-seen mint and updates its score', () => {
        recordClaim('123', 'mintA', 40);
        recordClaim('123', 'mintA', 55); // same mint, corrected score
        recordClaim('123', 'mintB', 45);
        const rep = getReputation('123', 'mintB') as DevReputation;
        expect(rep.priorTokens).toBe(1); // mintA counted once
        expect(rep.avgScore).toBe(55); // updated, not 40
    });

    it('classifies a proven builder as strong', () => {
        recordClaim('777', 'm1', 82);
        recordClaim('777', 'm2', 78);
        const rep = getReputation('777', 'm3') as DevReputation;
        expect(rep.avgScore).toBe(80);
        expect(rep.tier).toBe('strong');
    });

    it('keys reputation by user id independently', () => {
        recordClaim('111', 'x', 10);
        recordClaim('222', 'y', 90);
        expect(getReputation('111', 'z')?.avgScore).toBe(10);
        expect(getReputation('222', 'z')?.avgScore).toBe(90);
    });

    it('accepts numeric ids and ignores null ids', () => {
        recordClaim(999, 'm1', 60);
        expect(getReputation(999, 'm2')?.priorTokens).toBe(1);
        recordClaim(null, 'm', 50); // no-op
        expect(getReputation(null, 'm')).toBeNull();
    });
});
