class DouDiZhuGame {
    constructor() {
        this.cards = [];
        this.players = {
            player: { cards: [], isLandlord: false, lastPlay: null },
            leftAI: { cards: [], isLandowner: false, lastPlay: null },
            rightAI: { cards: [], isLandowner: false, lastPlay: null }
        };
        this.landlordCards = [];
        this.currentTurn = 'player';
        this.lastPlayPlayer = null;
        this.landlord = null;
        this.round = 1;
        this.passCount = 0;
        this.gameOver = false;
        this.difficulty = 1;
    }

    init(difficulty = 1) {
        this.difficulty = difficulty;
        this.reset();
    }

    reset() {
        this.cards = this.generateDeck();
        this.shuffle(this.cards);
        this.players.player.cards = this.cards.slice(0, 17);
        this.players.leftAI.cards = this.cards.slice(17, 34);
        this.players.rightAI.cards = this.cards.slice(34, 51);
        this.landlordCards = this.cards.slice(51, 54);
        this.sortCards(this.players.player.cards);
        this.sortCards(this.players.leftAI.cards);
        this.sortCards(this.players.rightAI.cards);
        this.currentTurn = 'player';
        this.lastPlayPlayer = null;
        this.landlord = null;
        this.round = 1;
        this.passCount = 0;
        this.gameOver = false;
        Object.keys(this.players).forEach(key => {
            this.players[key].isLandowner = false;
            this.players[key].lastPlay = null;
        });
    }

    generateDeck() {
        const suits = ['Spade', 'Heart', 'Club', 'Diamond'];
        const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        let deck = [];
        
        suits.forEach(suit => {
            values.forEach(value => {
                deck.push({ suit, value, name: `${suit}${value}` });
            });
        });
        
        deck.push({ suit: 'Joker', value: 'SB', name: 'JOKER-B', isSmallJoker: true });
        deck.push({ suit: 'Joker', value: 'SA', name: 'JOKER-A', isBigJoker: true });
        
        return deck;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    deal() {
        const allCards = [...this.cards];
        this.shuffle(allCards);
        
        this.players.player.cards = allCards.slice(0, 17);
        this.players.leftAI.cards = allCards.slice(17, 34);
        this.players.rightAI.cards = allCards.slice(34, 51);
        
        this.sortCards(this.players.player.cards);
        this.sortCards(this.players.leftAI.cards);
        this.sortCards(this.players.rightAI.cards);
        
        this.cards = [];
    }

    sortCards(cards) {
        const order = { '3': 0, '4': 1, '5': 2, '6': 3, '7': 4, '8': 5, '9': 6, '10': 7, 'J': 8, 'Q': 9, 'K': 10, 'A': 11, '2': 12, 'B': 13, 'A': 14 };
        
        cards.sort((a, b) => {
            if (a.isBigJoker) return 1;
            if (b.isBigJoker) return -1;
            if (a.isSmallJoker) return 1;
            if (b.isSmallJoker) return -1;

            const aValue = a.value === 'SA' ? 16 : (a.value === 'SB' ? 15 : order[a.value]);
            const bValue = b.value === 'SA' ? 16 : (b.value === 'SB' ? 15 : order[b.value]);
            
            if (aValue !== bValue) return aValue - bValue;
            
            const suitOrder = { 'Spade': 0, 'Heart': 1, 'Club': 2, 'Diamond': 3 };
            return (suitOrder[a.suit] || 0) - (suitOrder[b.suit] || 0);
        });
    }

    setLandlord(winner) {
        this.landlord = winner;
        this.players[winner].isLandowner = true;
        
        const landlordCards = this.landlordCards;
        this.players[winner].cards.push(...landlordCards);
        this.sortCards(this.players[winner].cards);
        
        this.landlordCards = landlordCards;
    }

    canPlayCards(cards, player = 'player') {
        if (!cards || cards.length === 0) return false;

        const currentCards = this.players[player].cards;
        const selectedSet = new Set(cards.map(c => c.name));
        const hasAllSelected = selectedSet.size === cards.length &&
                               cards.every(c => currentCards.some(cc => cc.name === c.name));

        if (!hasAllSelected) return false;

        const lastPlay = this.getLastPlay(player);

        if (!lastPlay || lastPlay.player === player) {
            return this.validatePlay(cards);
        }

        return this.validateAgainst(lastPlay.cards, cards);
    }

    getLastPlay(player) {
        for (let p of ['player', 'leftAI', 'rightAI']) {
            if (this.players[p].lastPlay) {
                return { player: p, cards: this.players[p].lastPlay };
            }
        }
        return null;
    }

    validatePlay(cards) {
        const pattern = this.identifyPattern(cards);
        return pattern !== null;
    }

    getPlayError(cards, player = 'player') {
        if (!cards || cards.length === 0) {
            return '请选择要出的牌';
        }

        const currentCards = this.players[player].cards;
        const hasAllSelected = cards.every(c => currentCards.some(cc => cc.name === c.name));
        if (!hasAllSelected) {
            return '选择的牌不在你手中';
        }

        const lastPlay = this.getLastPlay(player);
        const isFirstPlay = !lastPlay || lastPlay.player === player;

        if (isFirstPlay) {
            const pattern = this.identifyPattern(cards);
            if (!pattern) {
                return '这不是一个有效的牌型';
            }
            return null;
        }

        const lastPattern = this.identifyPattern(lastPlay.cards);
        const currentPattern = this.identifyPattern(cards);

        if (!currentPattern) {
            return '这不是一个有效的牌型';
        }

        if (!lastPattern) {
            return null;
        }

        if (currentPattern.type === 'rocket') {
            return null;
        }

        if (currentPattern.type === 'bomb' && lastPattern.type !== 'rocket') {
            return null;
        }

        if (lastPattern.type === 'rocket') {
            return '火箭是最大的牌型，无法被超越';
        }

        if (currentPattern.type !== lastPattern.type) {
            const typeNames = {
                'single': '单张',
                'pair': '对子',
                'triplet': '三张',
                'straight': '顺子',
                'straight_pair': '连对',
                'plane': '飞机',
                'plane_with_wings': '飞机带翅膀',
                'triplet_with_pair': '三带一对',
                'triplet_with_single': '三带一张',
                'bomb': '炸弹'
            };
            return `需要出 ${typeNames[lastPattern.type] || lastPattern.type}，不能出 ${typeNames[currentPattern.type] || currentPattern.type}`;
        }

        const lastValues = lastPattern.cards.map(c => CARD_NAMES[c.value] || 0);
        const currentValues = currentPattern.cards.map(c => CARD_NAMES[c.value] || 0);
        const lastMax = Math.max(...lastValues);
        const currentMax = Math.max(...currentValues);

        if (currentMax <= lastMax) {
            return `需要比上家的牌更大（上家最大牌：${this.getCardDisplayName(lastPattern.cards.reduce((a, b) => CARD_NAMES[a.value] > CARD_NAMES[b.value] ? a : b))}）`;
        }

        return null;
    }

    getCardDisplayName(card) {
        const valueNames = {
            '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
            'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A', '2': '2',
            'SB': '小王', 'SA': '大王'
        };
        return valueNames[card.value] || card.value;
    }

    validateAgainst(lastPlayCards, cards) {
        const lastPattern = this.identifyPattern(lastPlayCards);
        const currentPattern = this.identifyPattern(cards);

        if (!lastPattern || !currentPattern) return false;

        if (currentPattern.type === 'rocket') return true;
        if (lastPattern.type === 'rocket') return false;

        if (currentPattern.type === 'bomb') return true;

        if (lastPattern.type !== currentPattern.type) return false;

        return this.compareSequences(lastPattern.cards, currentPattern.cards, lastPattern.type);
    }

    identifyPattern(cards) {
        if (!cards || cards.length === 0) return null;

        const countMap = {};
        const valueMap = {};

        cards.forEach(card => {
            const value = card.value;
            countMap[value] = (countMap[value] || 0) + 1;
            valueMap[value] = (valueMap[value] || 0) + 1;
        });

        const counts = Object.values(countMap).sort((a, b) => b - a);
        const values = Object.keys(valueMap);
        
        if (cards.length === 1) {
            return { type: 'single', cards, value: cards[0].value === 'SA' ? 16 : (cards[0].value === 'SB' ? 15 : CARD_NAMES[cards[0].value]) };
        }
        
        if (counts[0] === 4 && counts.length === 1) {
            return { type: 'bomb', cards };
        }
        
        if (cards.length === 2 && counts[0] === 2) {
            return { type: 'pair', cards };
        }
        
        if (cards.length === 2 && 
            cards.some(c => c.name === 'JOKER-A') && 
            cards.some(c => c.name === 'JOKER-B')) {
            return { type: 'rocket', cards };
        }
        
        if (counts[0] === 3 && counts.length === 1) {
            return { type: 'triplet', cards };
        }
        
        if (counts[0] === 3 && counts.length === 2) {
            return { type: 'triplet_with_pair', cards };
        }
        
        if (counts[0] === 3 && counts.length === 3) {
            return { type: 'triplet_with_single', cards };
        }
        
        if (counts[0] === 2 && counts.length === 3) {
            return { type: 'plane', cards };
        }
        
        if (counts[0] === 2 && counts.length === 4) {
            return { type: 'plane_with_wings', cards };
        }
        
        if (this.isSequence(values, 5)) {
            return { type: 'straight', cards };
        }
        
        if (this.isSequence(values, 3) && counts.every(c => c === 2)) {
            return { type: 'straight_pair', cards };
        }
        
        if (counts[0] === 1 && this.isSequence(values, 6)) {
            return { type: 'straight', cards };
        }
        
        return null;
    }

    isSequence(values, minLength) {
        if (values.length < minLength) return false;
        
        const order = { '3': 0, '4': 1, '5': 2, '6': 3, '7': 4, '8': 5, '9': 6, '10': 7, 'J': 8, 'Q': 9, 'K': 10, 'A': 11, '2': 12 };
        
        const validValues = values.filter(v => order[v] !== undefined).map(v => order[v]);
        if (validValues.length !== values.length) return false;
        
        validValues.sort((a, b) => a - b);
        
        for (let i = 1; i < validValues.length; i++) {
            if (validValues[i] !== validValues[i - 1] + 1) return false;
        }
        
        return validValues[validValues.length - 1] - validValues[0] === validValues.length - 1;
    }

    compareSequences(lastCards, currentCards, type) {
        const lastValues = lastCards.map(c => CARD_NAMES[c.value] || 0);
        const currentValues = currentCards.map(c => CARD_NAMES[c.value] || 0);
        
        const lastMax = Math.max(...lastValues);
        const currentMax = Math.max(...currentValues);
        
        return currentMax > lastMax;
    }

    playCards(player, cards) {
        if (!this.canPlayCards(cards, player)) return false;
        
        this.players[player].cards = this.players[player].cards.filter(
            c => !cards.some(cc => cc.name === c.name)
        );
        
        this.players[player].lastPlay = cards;
        
        if (player !== 'player') {
            this.players[player].lastPlay = cards;
        }
        
        Object.keys(this.players).forEach(p => {
            if (p !== player) {
                this.players[p].lastPlay = null;
            }
        });
        
        if (this.players.player.cards.length === 0) return true;
        if (this.players.leftAI.cards.length === 0) return true;
        if (this.players.rightAI.cards.length === 0) return true;
        
        return false;
    }

    pass(player) {
        const lastPlay = this.getLastPlay(player);
        if (!lastPlay || lastPlay.player === player) return false;
        
        this.players[player].lastPlay = null;
        return true;
    }

    getNextTurn(current) {
        const order = ['player', 'leftAI', 'rightAI'];
        const currentIndex = order.indexOf(current);
        return order[(currentIndex + 1) % 3];
    }

    getValidPlays(player) {
        const cards = this.players[player].cards;
        const validPlays = [];

        const lastPlay = this.getLastPlay(player);
        const isFirstPlay = !lastPlay || lastPlay.player === player;

        if (isFirstPlay) {
            for (let size = 1; size <= cards.length; size++) {
                const combos = this.getCombinations(cards, size);
                combos.forEach(combo => {
                    if (this.validatePlay(combo)) {
                        validPlays.push(combo);
                    }
                });
            }
            return validPlays;
        }

        for (let size = 1; size <= cards.length; size++) {
            const combos = this.getCombinations(cards, size);
            combos.forEach(combo => {
                if (this.validateAgainst(lastPlay.cards, combo)) {
                    validPlays.push(combo);
                }
            });
        }

        return validPlays;
    }

    getCombinations(arr, size) {
        if (size === 1) return arr.map(el => [el]);
        if (size === arr.length) return [arr];
        
        const result = [];
        for (let i = 0; i <= arr.length - size; i++) {
            const first = arr[i];
            const rest = arr.slice(i + 1);
            const combos = this.getCombinations(rest, size - 1);
            combos.forEach(combo => result.push([first, ...combo]));
        }
        return result;
    }

    getHint(player) {
        const validPlays = this.getValidPlays(player);
        if (validPlays.length === 0) return null;

        const lastPlay = this.getLastPlay(player);

        if (!lastPlay || lastPlay.player === player) {
            const singles = validPlays.filter(p => p.length === 1);
            if (singles.length > 0) return singles[0];
            const pairs = validPlays.filter(p => p.length === 2 && this.identifyPattern(p)?.type === 'pair');
            if (pairs.length > 0) return pairs[0];
            return validPlays[0];
        }

        const lastPattern = this.identifyPattern(lastPlay.cards);

        const suitablePlays = validPlays.filter(p => {
            const currentPattern = this.identifyPattern(p);
            if (!currentPattern || !lastPattern) return false;
            if (currentPattern.type === 'rocket') return true;
            if (lastPattern.type === 'rocket') return false;
            if (currentPattern.type === 'bomb') return true;
            if (currentPattern.type !== lastPattern.type) return false;
            return this.compareSequences(lastPlay.cards, p, lastPattern.type);
        });

        if (suitablePlays.length > 0) {
            suitablePlays.sort((a, b) => {
                const aIsBomb = this.identifyPattern(a)?.type === 'bomb' || this.identifyPattern(a)?.type === 'rocket';
                const bIsBomb = this.identifyPattern(b)?.type === 'bomb' || this.identifyPattern(b)?.type === 'rocket';
                if (aIsBomb && !bIsBomb) return 1;
                if (!aIsBomb && bIsBomb) return -1;
                return a.length - b.length;
            });
            return suitablePlays[0];
        }

        return null;
    }

    getAICardCount(player) {
        return this.players[player].cards.length;
    }
}

window.DouDiZhuGame = DouDiZhuGame;
