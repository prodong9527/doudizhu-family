class StoreManager {
    constructor() {
        this.skins = [
            { id: 'default', name: '经典原皮', cost: 0, type: 'cardBack', owned: true },
            { id: 'bg_01', name: '牌背01', cost: 200, type: 'cardBack', owned: false },
            { id: 'bg_02', name: '牌背02', cost: 300, type: 'cardBack', owned: false },
            { id: 'bg_03', name: '牌背03', cost: 500, type: 'cardBack', owned: false },
            { id: 'bg_04', name: '牌背04', cost: 800, type: 'cardBack', owned: false },
            { id: 'bg_05', name: '牌背05', cost: 1000, type: 'cardBack', owned: false }
        ];
    }

    getAllSkins() {
        return this.skins.map(skin => ({ ...skin }));
    }

    getSkinById(id) {
        return this.skins.find(s => s.id === id);
    }

    purchaseSkin(skinId, userPoints) {
        const skin = this.getSkinById(skinId);
        if (!skin) return { success: false, error: '皮肤不存在' };
        if (skin.owned) return { success: false, error: '已拥有该皮肤' };
        if (userPoints < skin.cost) return { success: false, error: '积分不足' };
        
        return {
            success: true,
            newPoints: userPoints - skin.cost,
            skin: { ...skin, owned: true }
        };
    }

    getOwnedSkins(ownedIds) {
        return this.skins.filter(s => ownedIds.includes(s.id) || s.id === 'default');
    }

    getCardBackImage(skinId) {
        if (skinId === 'default') {
            return CONFIG.cardAssets.defaultBack;
        }
        
        const cardBacks = {
            'bg_01': '57套扑克牌+84套牌背/牌背/1.png',
            'bg_02': '57套扑克牌+84套牌背/牌背/2.png',
            'bg_03': '57套扑克牌+84套牌背/牌背/3.png',
            'bg_04': '57套扑克牌+84套牌背/牌背/4.png',
            'bg_05': '57套扑克牌+84套牌背/牌背/5.png'
        };
        
        return cardBacks[skinId] || CONFIG.cardAssets.defaultBack;
    }
}

window.StoreManager = StoreManager;
