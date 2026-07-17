/**
 * Tests for claim routing — the guard that keeps the channel to first-ever
 * GitHub social-fee claims only. Regression cover for the incident where
 * ordinary PumpSwap creator-fee collections ("Creator Claimed Fees") flooded
 * the GitHub-only channel because Path B had no gate.
 */

import { describe, it, expect } from 'vitest';
import {
	isCreatorClaimType,
	shouldPostCreatorClaim,
	CREATOR_CLAIM_TYPES,
} from '../claim-routing.js';

describe('isCreatorClaimType', () => {
	it('recognises every creator-fee claim type', () => {
		for (const t of CREATOR_CLAIM_TYPES) expect(isCreatorClaimType(t)).toBe(true);
	});

	it('does not treat GitHub social-fee claims as creator claims', () => {
		expect(isCreatorClaimType('claim_social_fee_pda')).toBe(false);
		expect(isCreatorClaimType('')).toBe(false);
		expect(isCreatorClaimType('something_else')).toBe(false);
	});
});

describe('shouldPostCreatorClaim', () => {
	const githubOnly = { requireGithub: true, feeDistributions: false };
	const general = { requireGithub: false, feeDistributions: false };
	const generalWithDist = { requireGithub: false, feeDistributions: true };

	it('NEVER posts creator claims on a GitHub-only channel (the bug)', () => {
		expect(shouldPostCreatorClaim('collect_creator_fee', githubOnly)).toBe(false);
		expect(shouldPostCreatorClaim('collect_coin_creator_fee', githubOnly)).toBe(false);
		expect(shouldPostCreatorClaim('distribute_creator_fees', githubOnly)).toBe(false);
		// Even with fee distributions on, requireGithub wins.
		expect(
			shouldPostCreatorClaim('distribute_creator_fees', { requireGithub: true, feeDistributions: true }),
		).toBe(false);
	});

	it('posts ordinary creator claims when the channel is NOT GitHub-only', () => {
		expect(shouldPostCreatorClaim('collect_creator_fee', general)).toBe(true);
		expect(shouldPostCreatorClaim('collect_coin_creator_fee', general)).toBe(true);
	});

	it('gates distribute_creator_fees behind the feeDistributions toggle off the GitHub channel', () => {
		expect(shouldPostCreatorClaim('distribute_creator_fees', general)).toBe(false);
		expect(shouldPostCreatorClaim('distribute_creator_fees', generalWithDist)).toBe(true);
	});

	it('never posts a non-creator claim type through this path', () => {
		expect(shouldPostCreatorClaim('claim_social_fee_pda', general)).toBe(false);
		expect(shouldPostCreatorClaim('claim_social_fee_pda', githubOnly)).toBe(false);
	});
});
