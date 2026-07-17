/**
 * Claim routing — decides which fee-claim events this channel is allowed to post.
 *
 * The channel exists only to surface first-ever GitHub social-fee claims. Ordinary
 * PumpSwap creator-fee collections (collect_creator_fee, collect_coin_creator_fee,
 * distribute_creator_fees) are NOT GitHub-linked, so on a GitHub-only channel
 * (REQUIRE_GITHUB=true, the default) they must never be posted — that was the bug
 * that flooded the channel with unrelated "Creator Claimed Fees" cards.
 */

export const CREATOR_CLAIM_TYPES = [
	'collect_creator_fee',
	'collect_coin_creator_fee',
	'distribute_creator_fees',
] as const;

const CREATOR_CLAIM_SET = new Set<string>(CREATOR_CLAIM_TYPES);

/** True if the claim is an ordinary creator-fee collection (not a GitHub social-fee claim). */
export function isCreatorClaimType(claimType: string): boolean {
	return CREATOR_CLAIM_SET.has(claimType);
}

export interface CreatorPostPolicy {
	/** REQUIRE_GITHUB — when true, creator-fee claims are never posted here. */
	requireGithub: boolean;
	/** FEED_FEE_DISTRIBUTIONS — distribute_creator_fees is opt-in even off the GitHub channel. */
	feeDistributions: boolean;
}

/**
 * Whether a creator-fee claim should actually be POSTED on this channel.
 * - Non-creator claim types are not this function's concern → false.
 * - GitHub-only channel (requireGithub) → never post creator claims.
 * - distribute_creator_fees additionally requires the feeDistributions toggle.
 */
export function shouldPostCreatorClaim(claimType: string, policy: CreatorPostPolicy): boolean {
	if (!isCreatorClaimType(claimType)) return false;
	if (policy.requireGithub) return false;
	if (claimType === 'distribute_creator_fees') return policy.feeDistributions;
	return true;
}
