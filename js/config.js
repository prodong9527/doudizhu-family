const CONFIG = {
    firebase: {
        apiKey: "YOUR_FIREBASE_API_KEY",
        authDomain: "YOUR_PROJECT.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT.appspot.com",
        messagingSenderId: "YOUR_SENDER_ID",
        appId: "YOUR_APP_ID"
    },
    minimax: {
        apiKey: "sk-cp-sNy6EkGTdMG6uPxGzn4mPBMGFk_1t5P0CB8R1ZOGNRqT-pEeQgcTJK63wyERuqXaajeOLo_rRg0YGxrF_Be71wXs781-Z--_nNSwAER1I1QR_4nTZj0FuBY",
        groupId: "YOUR_GROUP_ID"
    },
    cardAssets: {
        pngPath: '原皮高清全套扑克牌/PNG/',
        gifPath: '原皮高清全套扑克牌/GIF/',
        defaultBack: '原皮高清全套扑克牌/PNG/Background.png'
    },
    ranks: [
        { name: '青铜', tiers: 3, starsPerTier: 3, difficulty: 1 },
        { name: '白银', tiers: 3, starsPerTier: 3, difficulty: 2 },
        { name: '黄金', tiers: 3, starsPerTier: 3, difficulty: 3 },
        { name: '铂金', tiers: 3, starsPerTier: 3, difficulty: 4 },
        { name: '钻石', tiers: 3, starsPerTier: 3, difficulty: 5 }
    ],
    rewards: {
        perfectWin: 3,
        closeWin: 2,
        nearLoss: 1,
        normalWin: 2,
        normalLoss: 1,
        dailyFirstWin: 20,
        winPoints: 50,
        lossPoints: 10,
        perfectWinBonus: 30
    }
};

const CARD_NAMES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14,
    'SB': 15, 'SA': 16
};

const SUIT_NAMES = ['Spade', 'Heart', 'Club', 'Diamond'];

window.CONFIG = CONFIG;
window.CARD_NAMES = CARD_NAMES;
window.SUIT_NAMES = SUIT_NAMES;
