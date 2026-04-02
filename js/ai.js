class AIPlayer {
    constructor(difficulty = 1) {
        this.difficulty = difficulty;
        this.memory = { playedCards: [], cardCounts: {} };
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    getPlay(cards, gameState) {
        const validPlays = gameState.getValidPlays(this.name);
        
        if (validPlays.length === 0) return null;
        
        if (this.difficulty === 1) {
            return this.playEasy(validPlays, gameState);
        } else if (this.difficulty === 2) {
            return this.playMedium(validPlays, gameState);
        } else if (this.difficulty === 3) {
            return this.playHard(validPlays, gameState);
        } else {
            return this.playExpert(validPlays, gameState);
        }
    }

    playEasy(validPlays, gameState) {
        const shouldPlayLow = Math.random() < 0.4;
        
        if (shouldPlayLow) {
            validPlays.sort((a, b) => this.getCardValue(a) - this.getCardValue(b));
        } else {
            validPlays.sort((a, b) => this.getCardValue(b) - this.getCardValue(a));
        }
        
        if (Math.random() < 0.15) {
            return validPlays[Math.floor(Math.random() * validPlays.length)];
        }
        
        return validPlays[0];
    }

    playMedium(validPlays, gameState) {
        const lastPlay = this.getLastPlayInfo(gameState);
        
        if (lastPlay) {
            const goodPlays = validPlays.filter(p => this.isReasonablyStrong(p, lastPlay));
            if (goodPlays.length > 0) {
                goodPlays.sort((a, b) => this.getCardValue(a) - this.getCardValue(b));
                return goodPlays[0];
            }
        }
        
        const nonBombPlays = validPlays.filter(p => {
            const pattern = gameState.identifyPattern(p);
            return pattern && pattern.type !== 'bomb' && pattern.type !== 'rocket';
        });
        
        if (nonBombPlays.length > 0) {
            nonBombPlays.sort((a, b) => this.getCardValue(a) - this.getCardValue(b));
            return nonBombPlays[0];
        }
        
        return validPlays[0];
    }

    playHard(validPlays, gameState) {
        const lastPlay = this.getLastPlayInfo(gameState);
        
        const cardsLeft = this.getTeamCardCount(gameState);
        const isLowOnCards = cardsLeft <= 5;
        
        if (lastPlay) {
            if (isLowOnCards) {
                const winningPlays = validPlays.filter(p => this.canWinWith(p, lastPlay));
                if (winningPlays.length > 0) {
                    const nonBombs = winningPlays.filter(p => {
                        const pattern = gameState.identifyPattern(p);
                        return pattern && pattern.type !== 'bomb' && pattern.type !== 'rocket';
                    });
                    if (nonBombs.length > 0) return nonBombs[0];
                    return winningPlays[0];
                }
            }
        }
        
        const safePlays = validPlays.filter(p => !this.isBomb(p));
        if (safePlays.length > 0) {
            safePlays.sort((a, b) => this.getCardValue(a) - this.getCardValue(b));
            return safePlays[0];
        }
        
        return validPlays[0];
    }

    playExpert(validPlays, gameState) {
        const lastPlay = this.getLastPlayInfo(gameState);
        const myCards = gameState.players[this.name].cards;
        
        const singleCards = myCards.filter(c => {
            return myCards.filter(cc => cc.value === c.value).length === 1;
        });
        
        if (lastPlay && singleCards.length > 0) {
            const lastPattern = gameState.identifyPattern(lastPlay.cards);
            if (lastPattern && lastPattern.type === 'single') {
                const safeSingles = singleCards.filter(c => 
                    CARD_NAMES[c.value] < CARD_NAMES[lastPlay.cards[0].value]
                );
                if (safeSingles.length > 0) {
                    const lowSingles = this.getLowValueCards(safeSingles, 10);
                    if (lowSingles.length > 0) return lowSingles;
                }
            }
        }
        
        const bombs = validPlays.filter(p => this.isBomb(p));
        if (bombs.length > 0 && myCards.length <= 5) {
            return bombs[0];
        }
        
        return this.playHard(validPlays, gameState);
    }

    isReasonablyStrong(play, lastPlay) {
        const lastValue = CARD_NAMES[lastPlay.cards[0].value] || 0;
        const playValue = CARD_NAMES[play[0].value] || 0;
        return playValue > lastValue || this.isBomb(play);
    }

    canWinWith(play, lastPlay) {
        if (this.isBomb(play)) return true;
        
        const lastValue = CARD_NAMES[lastPlay.cards[0].value] || 0;
        const playValue = CARD_NAMES[play[0].value] || 0;
        
        return playValue > lastValue;
    }

    isBomb(play) {
        const pattern = this.identifyPattern(play);
        return pattern && (pattern.type === 'bomb' || pattern.type === 'rocket');
    }

    identifyPattern(cards) {
        if (!cards || cards.length === 0) return null;
        
        const counts = {};
        cards.forEach(c => {
            counts[c.name] = (counts[c.name] || 0) + 1;
        });
        
        const countValues = Object.values(counts).sort((a, b) => b - a);
        
        if (cards.length === 1) return { type: 'single' };
        if (countValues[0] === 4) return { type: 'bomb' };
        if (cards.length === 2 && countValues[0] === 2) return { type: 'pair' };
        if (cards.length === 2 && cards.some(c => c.name === 'JOKER-A') && cards.some(c => c.name === 'JOKER-B')) {
            return { type: 'rocket' };
        }
        if (countValues[0] === 3) return { type: 'triplet' };
        
        return { type: 'other' };
    }

    getCardValue(cards) {
        return Math.max(...cards.map(c => CARD_NAMES[c.value] || 0));
    }

    getLowValueCards(cards, maxValue) {
        return cards.filter(c => (CARD_NAMES[c.value] || 0) <= maxValue);
    }

    getLastPlayInfo(gameState) {
        for (let p of ['player', 'leftAI', 'rightAI']) {
            if (p !== this.name && gameState.players[p].lastPlay) {
                return { player: p, cards: gameState.players[p].lastPlay };
            }
        }
        return null;
    }

    getTeamCardCount(gameState) {
        let total = 0;
        if (this.name === 'leftAI') {
            total += gameState.players.leftAI.cards.length;
            total += gameState.players.player.cards.length;
        } else if (this.name === 'rightAI') {
            total += gameState.players.rightAI.cards.length;
            total += gameState.players.player.cards.length;
        }
        return total;
    }
}

window.AIPlayer = AIPlayer;
