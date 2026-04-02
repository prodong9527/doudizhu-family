class RankManager {
    constructor() {
        this.ranks = CONFIG.ranks;
    }

    getRankInfo(level, tier) {
        return {
            name: this.ranks[level].name,
            tier: tier + 1,
            totalTiers: this.ranks[level].tiers,
            difficulty: this.ranks[level].difficulty
        };
    }

    getStarsForLevel(level, tier, stars) {
        let totalRequired = 0;
        for (let l = 0; l < level; l++) {
            totalRequired += this.ranks[l].tiers * this.ranks[l].starsPerTier;
        }
        totalRequired += tier * this.ranks[level].starsPerTier;
        return { current: stars, required: totalRequired };
    }

    calculateRewards(playerRank, aiCardsRemaining) {
        const rewards = { stars: 0, points: 0 };
        const isWin = aiCardsRemaining >= 0;
        
        if (isWin) {
            rewards.points = CONFIG.rewards.winPoints;
            
            if (aiCardsRemaining > 10) {
                rewards.stars = CONFIG.rewards.perfectWin;
                rewards.points += CONFIG.rewards.perfectWinBonus;
            } else if (aiCardsRemaining > 0) {
                rewards.stars = CONFIG.rewards.closeWin;
            } else {
                rewards.stars = CONFIG.rewards.normalWin;
            }
        } else {
            rewards.points = CONFIG.rewards.normalLoss;
            const absRemaining = Math.abs(aiCardsRemaining);
            if (absRemaining === 1) {
                rewards.stars = CONFIG.rewards.nearLoss;
            }
            
            const rankInfo = this.getRankInfo(playerRank.level, playerRank.tier);
            if (playerRank.tier > 0 || playerRank.stars > 0) {
                rewards.stars = -Math.abs(rewards.stars);
            }
        }
        
        return rewards;
    }

    addStars(currentRank, starsToAdd) {
        let { level, tier, stars, totalStars } = currentRank;
        stars += starsToAdd;
        totalStars += Math.max(0, starsToAdd);
        
        while (stars >= this.ranks[level].starsPerTier) {
            stars -= this.ranks[level].starsPerTier;
            tier++;
            
            if (tier >= this.ranks[level].tiers) {
                tier = 0;
                level++;
                
                if (level >= this.ranks.length) {
                    level = this.ranks.length - 1;
                    tier = this.ranks[level].tiers - 1;
                    stars = this.ranks[level].starsPerTier - 1;
                    break;
                }
            }
        }
        
        if (stars < 0) {
            tier--;
            if (tier < 0) {
                level--;
                if (level < 0) {
                    level = 0;
                    tier = 0;
                    stars = 0;
                } else {
                    tier = this.ranks[level].tiers - 1;
                    stars += this.ranks[level].starsPerTier;
                }
            }
            stars = Math.max(0, stars);
        }
        
        return { level, tier, stars, totalStars };
    }

    getDifficulty(level) {
        return this.ranks[level].difficulty;
    }

    getRankBadge(level) {
        const badges = {
            0: { symbol: '铜', color: '#CD7F32' },
            1: { symbol: '银', color: '#C0C0C0' },
            2: { symbol: '金', color: '#FFD700' },
            3: { symbol: '铂', color: '#E5E4E2' },
            4: { symbol: '钻', color: '#B9F2FF' }
        };
        return badges[level] || badges[0];
    }

    formatRankDisplay(rank) {
        const info = this.getRankInfo(rank.level, rank.tier);
        return `${info.name} ${info.tier}阶`;
    }

    getProgressPercent(rank) {
        const info = this.getRankInfo(rank.level, rank.tier);
        return (rank.stars / this.ranks[rank.level].starsPerTier) * 100;
    }
}

window.RankManager = RankManager;
