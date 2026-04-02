import { AuthManager } from './auth.js';

(function() {
    let auth, game, leftAI, rightAI, rankManager, storeManager, audio;
    let currentScreen = 'loading';
    let userData = null;
    let currentGameState = null;
    let selectedCards = [];
    let isAnimating = false;
    let authChecked = false;

    function init() {
        initManagers();
        bindEvents();
    }

    function initManagers() {
        rankManager = new RankManager();
        storeManager = new StoreManager();
        audio = new AudioManager();
        game = new DouDiZhuGame();
        leftAI = new AIPlayer();
        rightAI = new AIPlayer();
        auth = new AuthManager();
    }

    function bindEvents() {
        document.getElementById('login-btn').addEventListener('click', handleLogin);
        document.getElementById('register-btn').addEventListener('click', handleRegister);
        document.getElementById('guest-btn').addEventListener('click', handleGuest);
        document.getElementById('start-match-btn').addEventListener('click', startMatch);
        document.getElementById('play-btn').addEventListener('click', playCards);
        document.getElementById('pass-btn').addEventListener('click', passTurn);
        document.getElementById('hint-btn').addEventListener('click', showHint);
        document.getElementById('game-quit-btn').addEventListener('click', quitGame);
        document.getElementById('result-continue-btn').addEventListener('click', returnToHome);
        document.getElementById('logout-btn').addEventListener('click', handleLogout);
        document.getElementById('promotion-close-btn').addEventListener('click', closePromotion);
        document.getElementById('sound-toggle').addEventListener('click', toggleSound);

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => navigateTo(btn.dataset.page));
        });

        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => navigateTo(btn.dataset.page));
        });

        document.getElementById('call-no-btn').addEventListener('click', () => callLandlord(false));
        document.getElementById('call-yes-btn').addEventListener('click', () => callLandlord(true));

        const usernameInput = document.getElementById('username-input');
        const passwordInput = document.getElementById('password-input');
        usernameInput.addEventListener('keypress', e => e.key === 'Enter' && handleLogin());
        passwordInput.addEventListener('keypress', e => e.key === 'Enter' && handleLogin());

        document.addEventListener('click', () => audio.requireInteraction(), { once: true });
        document.addEventListener('touchstart', () => audio.requireInteraction(), { once: true });

        const startOverlay = document.getElementById('start-overlay');
        if (startOverlay) {
            startOverlay.addEventListener('click', handleStartClick);
            startOverlay.addEventListener('touchstart', handleStartClick);
        }
    }

    function handleStartClick() {
        if (authChecked) return;
        authChecked = true;

        const startOverlay = document.getElementById('start-overlay');
        if (startOverlay) {
            startOverlay.classList.add('hidden');
        }
        audio.requireInteraction();
        setTimeout(() => {
            if (auth.isLoggedIn()) {
                loadUserDataAndShowHome();
            } else {
                const guestData = localStorage.getItem('doudizhu_guest_data');
                if (guestData) {
                    handleGuest();
                } else {
                    showScreen('auth');
                }
            }
        }, 500);
    }

    function checkAuth() {
        if (authChecked) return;
        authChecked = true;
        setTimeout(() => {
            if (auth.isLoggedIn()) {
                loadUserDataAndShowHome();
            } else {
                const guestData = localStorage.getItem('doudizhu_guest_data');
                if (guestData) {
                    handleGuest();
                } else {
                    showScreen('auth');
                }
            }
        }, 1500);
    }

    async function loadUserDataAndShowHome() {
        if (auth.isGuestUser()) {
            userData = auth.getUserData();
        } else {
            userData = await auth.loadUserData();
        }
        if (userData) {
            updateHomeUI();
            showScreen('home');
        } else {
            showScreen('auth');
        }
    }

    function handleLogin() {
        const username = document.getElementById('username-input').value.trim();
        const password = document.getElementById('password-input').value;
        
        if (!username || !password) {
            showToast('请输入用户名和密码');
            return;
        }

        playSound('click');
        
        auth.login(username, password).then(result => {
            if (result.success) {
                loadUserDataAndShowHome();
            } else {
                showToast('登录失败：' + result.error);
            }
        });
    }

    function handleRegister() {
        const username = document.getElementById('username-input').value.trim();
        const password = document.getElementById('password-input').value;
        
        if (!username || !password) {
            showToast('请输入用户名和密码');
            return;
        }
        
        if (username.length < 3) {
            showToast('用户名至少3个字符');
            return;
        }
        
        if (password.length < 6) {
            showToast('密码至少6个字符');
            return;
        }

        playSound('click');
        
        auth.register(username, password).then(result => {
            if (result.success) {
                userData = result.data;
                updateHomeUI();
                showScreen('home');
                showToast('注册成功');
            } else {
                showToast('注册失败：' + result.error);
            }
        });
    }

    async function handleLogout() {
        playSound('click');
        await auth.logout();
        showScreen('auth');
        document.getElementById('username-input').value = '';
        document.getElementById('password-input').value = '';
    }

    function handleGuest() {
        playSound('click');
        const result = auth.enterGuestMode();
        if (result.success) {
            userData = result.data;
            updateHomeUI();
            showScreen('home');
            showToast('欢迎 ' + userData.username);
        }
    }

    function navigateTo(page) {
        playSound('click');
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        switch(page) {
            case 'home':
                updateHomeUI();
                showScreen('home');
                break;
            case 'match':
                updateMatchUI();
                showScreen('match');
                break;
            case 'shop':
                updateShopUI();
                showScreen('shop');
                break;
            case 'profile':
                updateProfileUI();
                showScreen('profile');
                break;
        }
    }

    function updateHomeUI() {
        if (!userData) return;
        
        document.getElementById('home-username').textContent = userData.username;
        
        const rankInfo = rankManager.getRankInfo(userData.rank.level, userData.rank.tier);
        document.getElementById('home-rank-display').textContent = rankManager.formatRankDisplay(userData.rank);
        
        document.getElementById('home-points').textContent = userData.points;
        document.getElementById('home-stars').textContent = userData.rank.stars;
        
        document.getElementById('current-rank-badge').textContent = rankManager.getRankBadge(userData.rank.level).symbol;
        
        document.getElementById('current-rank-name').textContent = rankInfo.name;
        document.getElementById('current-rank-tier').textContent = `${rankInfo.tier}阶`;
        
        const starsHtml = Array(rankManager.ranks[userData.rank.level].starsPerTier)
            .fill(0)
            .map((_, i) => `<span class="star ${i < userData.rank.stars ? 'filled' : ''}">★</span>`)
            .join('');
        document.getElementById('rank-stars-display').innerHTML = starsHtml;
        
        const progress = rankManager.getProgressPercent(userData.rank);
        document.getElementById('rank-progress-fill').style.width = `${progress}%`;
        document.getElementById('rank-progress-text').textContent = 
            `${userData.rank.stars}/${rankManager.ranks[userData.rank.level].starsPerTier} 星星`;
        
        document.getElementById('total-games').textContent = userData.stats.totalGames;
        const winRate = userData.stats.totalGames > 0 
            ? Math.round((userData.stats.wins / userData.stats.totalGames) * 100) 
            : 0;
        document.getElementById('win-rate').textContent = `${winRate}%`;
        document.getElementById('perfect-wins').textContent = userData.stats.perfectWins;
    }

    function updateMatchUI() {
        if (!userData) return;
        const rankInfo = rankManager.getRankInfo(userData.rank.level, userData.rank.tier);
        document.getElementById('match-current-rank').textContent = rankManager.formatRankDisplay(userData.rank);
    }

    function updateShopUI() {
        if (!userData) return;
        
        document.getElementById('shop-points').textContent = userData.points;
        
        const grid = document.getElementById('shop-grid');
        grid.innerHTML = '';
        
        storeManager.getAllSkins().forEach(skin => {
            const owned = userData.skins.includes(skin.id);
            const equipped = userData.currentSkin === skin.id;
            
            const item = document.createElement('div');
            item.className = `shop-item ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}`;
            
            const cardBackUrl = storeManager.getCardBackImage(skin.id);
            
            item.innerHTML = `
                <div class="shop-item-preview">
                    <img src="${cardBackUrl}" alt="${skin.name}" onerror="this.src='${CONFIG.cardAssets.defaultBack}'">
                </div>
                <div class="shop-item-name">${skin.name}</div>
                <div class="shop-item-price ${owned ? 'owned-text' : ''}">
                    ${owned ? '已拥有' : skin.cost + ' 积分'}
                </div>
                <button class="shop-item-btn ${owned ? (equipped ? 'equipped' : 'use') : 'buy'}">
                    ${equipped ? '使用中' : owned ? '使用' : '购买'}
                </button>
            `;
            
            item.querySelector('.shop-item-btn').addEventListener('click', () => {
                playSound('click');
                if (owned) {
                    useSkin(skin.id);
                } else {
                    purchaseSkin(skin.id);
                }
            });
            
            grid.appendChild(item);
        });
    }

    async function purchaseSkin(skinId) {
        const skin = storeManager.getSkinById(skinId);
        if (userData.points < skin.cost) {
            showToast('积分不足');
            return;
        }
        
        const result = storeManager.purchaseSkin(skinId, userData.points);
        if (result.success) {
            userData.points = result.newPoints;
            userData.skins.push(skinId);
            userData.currentSkin = skinId;
            
            await auth.updateUserData({
                points: userData.points,
                skins: userData.skins,
                currentSkin: userData.currentSkin
            });
            
            updateShopUI();
            showToast('购买成功');
            playSound('victory');
        } else {
            showToast(result.error);
        }
    }

    async function useSkin(skinId) {
        userData.currentSkin = skinId;
        await auth.updateUserData({ currentSkin: skinId });
        updateShopUI();
        playSound('click');
    }

    function updateProfileUI() {
        if (!userData) return;
        
        document.getElementById('profile-username').textContent = userData.username;
        document.getElementById('profile-rank').textContent = rankManager.formatRankDisplay(userData.rank);
        
        document.getElementById('profile-total-games').textContent = userData.stats.totalGames;
        document.getElementById('profile-wins').textContent = userData.stats.wins;
        document.getElementById('profile-losses').textContent = 
            userData.stats.totalGames - userData.stats.wins;
        document.getElementById('profile-perfect').textContent = userData.stats.perfectWins;
    }

    function startMatch() {
        playSound('click');
        
        const btn = document.getElementById('start-match-btn');
        btn.textContent = '匹配中...';
        btn.classList.add('matching');
        
        const difficulty = rankManager.getDifficulty(userData.rank.level);
        leftAI.setDifficulty(difficulty);
        rightAI.setDifficulty(difficulty);
        
        leftAI.name = 'leftAI';
        rightAI.name = 'rightAI';
        
        game.init(difficulty);
        
        setTimeout(() => {
            btn.textContent = '开始匹配';
            btn.classList.remove('matching');
            startGame();
        }, 1500);
    }

    function startGame() {
        showScreen('game');
        currentGameState = 'call';
        selectedCards = [];
        
        document.getElementById('game-round').textContent = '叫地主阶段';
        document.getElementById('game-status').textContent = '等待叫地主';
        
        updatePlayerHand();
        showCallDialog();
    }

    function showCallDialog() {
        const overlay = document.getElementById('call-landlord-overlay');
        overlay.classList.add('active');
        
        const landlordCardsDisplay = document.getElementById('landlord-cards-display');
        landlordCardsDisplay.innerHTML = '';
        
        game.landlordCards.forEach((card, i) => {
            const cardEl = document.getElementById(`call-card-${i}`);
            cardEl.style.backgroundImage = `url(${CONFIG.cardAssets.pngPath}${card.name}.png)`;
            cardEl.style.backgroundSize = 'contain';
            cardEl.style.backgroundRepeat = 'no-repeat';
        });
    }

    function callLandlord(yes) {
        playSound('click');
        
        document.getElementById('call-landlord-overlay').classList.remove('active');
        
        if (yes || (userData.rank.level > 0 && Math.random() < 0.3)) {
            game.setLandlord('player');
            currentGameState = 'playing';
            startPlaying();
        } else {
            const aiWins = Math.random() < 0.6;
            const winner = aiWins ? (Math.random() < 0.5 ? 'leftAI' : 'rightAI') : 'player';
            game.setLandlord(winner);
            currentGameState = 'playing';
            
            if (winner !== 'player') {
                setTimeout(() => {
                    startPlaying();
                    if (winner === 'leftAI') {
                        aiPlay('leftAI');
                    } else {
                        aiPlay('rightAI');
                    }
                }, 500);
            } else {
                startPlaying();
            }
        }
    }

    function startPlaying() {
        document.getElementById('game-round').textContent = '对战开始';
        document.getElementById('game-status').textContent = game.players.player.isLandowner ? '你是地主' : '你是农民';
        
        updatePlayerHand();
        updateAIHandDisplay();
        updateLandlordCardsDisplay();
        
        if (game.players.player.isLandowner) {
            currentGameState = 'playing';
            enableControls(true);
        } else {
            const firstPlayer = ['player', 'leftAI', 'rightAI'][Math.floor(Math.random() * 3)];
            game.currentTurn = firstPlayer;
            updateTurnIndicator();
            
            if (firstPlayer !== 'player') {
                enableControls(false);
                setTimeout(() => aiPlay(firstPlayer), 1000);
            } else {
                enableControls(true);
            }
        }
    }

    function updatePlayerHand() {
        const hand = document.getElementById('player-hand');
        hand.innerHTML = '';

        const cards = game.players.player.cards;
        cards.forEach((card, i) => {
            const slot = document.createElement('div');
            slot.className = 'card-slot';
            slot.dataset.index = i;

            const img = document.createElement('img');
            img.className = 'card-img';
            img.src = `${CONFIG.cardAssets.pngPath}${card.name}.png`;
            img.alt = card.name;

            slot.appendChild(img);
            slot.addEventListener('click', () => toggleCardSelection(i));
            hand.appendChild(slot);
        });

        const playerCount = document.getElementById('player-cards-count');
        if (playerCount) {
            playerCount.textContent = cards.length;
        }
    }

    function updateAIHandDisplay() {
        const leftCount = document.getElementById('left-cards-count');
        const rightCount = document.getElementById('right-cards-count');
        
        leftCount.textContent = game.players.leftAI.cards.length;
        rightCount.textContent = game.players.rightAI.cards.length;
    }

    function updateLandlordCardsDisplay() {
        const display = document.getElementById('landlord-cards-display');
        display.innerHTML = '';
        
        if (!game.players.player.isLandowner) return;
        
        game.landlordCards.forEach(card => {
            const img = document.createElement('img');
            img.src = `${CONFIG.cardAssets.pngPath}${card.name}.png`;
            img.style.width = '40px';
            img.style.height = '60px';
            img.style.objectFit = 'contain';
            display.appendChild(img);
        });
    }

    function updateTurnIndicator() {
        const indicator = document.getElementById('turn-indicator');
        const turnMap = {
            'player': '你的回合',
            'leftAI': '左方AI回合',
            'rightAI': '右方AI回合'
        };
        
        indicator.textContent = turnMap[game.currentTurn];
        indicator.classList.toggle('my-turn', game.currentTurn === 'player');
    }

    function toggleCardSelection(index) {
        playSound('cardSelect');

        const slots = document.querySelectorAll('#player-hand .card-slot');
        const cardIndex = selectedCards.indexOf(index);

        if (cardIndex > -1) {
            selectedCards.splice(cardIndex, 1);
            slots[index].classList.remove('selected');
        } else {
            selectedCards.push(index);
            slots[index].classList.add('selected');
        }

        updatePlayButton();
    }

    function updatePlayButton() {
        const playBtn = document.getElementById('play-btn');
        const passBtn = document.getElementById('pass-btn');

        const isMyTurn = game.currentTurn === 'player';
        const hasSelection = selectedCards.length > 0;
        const lastPlay = getLastPlay();
        const hasPreviousPlay = lastPlay && lastPlay.player !== 'player';

        playBtn.disabled = !isMyTurn || !hasSelection || isAnimating;
        passBtn.disabled = !isMyTurn;
    }

    function getLastPlay() {
        for (let p of ['player', 'leftAI', 'rightAI']) {
            if (game.players[p].lastPlay) {
                return { player: p, cards: game.players[p].lastPlay };
            }
        }
        return null;
    }

    function playCards() {
        if (selectedCards.length === 0 || game.currentTurn !== 'player' || isAnimating) return;

        const selectedCardObjects = selectedCards.map(i => game.players.player.cards[i]);

        const error = game.getPlayError(selectedCardObjects, 'player');
        if (error) {
            playSound('error');
            showErrorDialog(error);
            return;
        }

        isAnimating = true;
        playSound('cardPlay');
        
        animatePlayCards('player', selectedCardObjects, () => {
            const isGameOver = game.playCards('player', selectedCardObjects);

            document.getElementById('left-last-play').innerHTML = '';
            document.getElementById('right-last-play').innerHTML = '';

            selectedCards = [];
            updatePlayerHand();
            updateAIHandDisplay();
            
            if (isGameOver) {
                endGame('player');
            } else {
                game.currentTurn = game.getNextTurn('player');
                game.passCount = 0;
                updateTurnIndicator();
                
                if (game.currentTurn !== 'player') {
                    enableControls(false);
                    setTimeout(() => aiPlay(game.currentTurn), 800);
                }
            }
            
            isAnimating = false;
            updatePlayButton();
        });
    }

    function passTurn() {
        if (game.currentTurn !== 'player' || isAnimating) return;

        playSound('click');

        const lastPlay = getLastPlay();
        const canPass = lastPlay && lastPlay.player !== 'player';

        if (canPass) {
            game.pass('player');
            game.passCount++;
        } else {
            game.passCount = 0;
        }

        if (game.passCount >= 2) {
            Object.keys(game.players).forEach(p => {
                game.players[p].lastPlay = null;
            });
            game.passCount = 0;
            document.getElementById('left-last-play').innerHTML = '';
            document.getElementById('right-last-play').innerHTML = '';
        }

        game.currentTurn = game.getNextTurn('player');
        updateTurnIndicator();
        updatePlayButton();

        setTimeout(() => aiPlay(game.currentTurn), 600);
    }

    function showHint() {
        playSound('click');

        if (game.currentTurn !== 'player') {
            showToast('请等待你的回合');
            return;
        }

        const hint = game.getHint('player');
        if (!hint) {
            const lastPlay = getLastPlay();
            if (lastPlay && lastPlay.player !== 'player') {
                showErrorDialog('你没有能出的牌，请点击"不出"跳过');
            } else {
                showErrorDialog('你手中没有有效的牌型');
            }
            return;
        }

        const slots = document.querySelectorAll('#player-hand .card-slot');
        slots.forEach(s => s.classList.remove('selected'));
        selectedCards = [];

        const cardNames = hint.map(c => c.name);
        game.players.player.cards.forEach((card, i) => {
            if (cardNames.includes(card.name)) {
                selectedCards.push(i);
                slots[i].classList.add('selected');
            }
        });

        updatePlayButton();
    }

    function aiPlay(player) {
        if (game.currentTurn !== player || isAnimating) return;
        
        const ai = player === 'leftAI' ? leftAI : rightAI;
        const aiGame = { ...game, players: { ...game.players } };
        
        let play = ai.getPlay(game.players[player].cards, game);
        
        if (!play) {
            const lastPlay = getLastPlay();
            if (lastPlay && lastPlay.player !== player) {
                game.pass(player);
                game.passCount++;

                if (game.passCount >= 2) {
                    Object.keys(game.players).forEach(p => {
                        game.players[p].lastPlay = null;
                    });
                    game.passCount = 0;
                    document.getElementById('left-last-play').innerHTML = '';
                    document.getElementById('right-last-play').innerHTML = '';
                }
            }
        } else {
            isAnimating = true;
            playSound('cardPlay');

            animatePlayCards(player, play, () => {
                const isGameOver = game.playCards(player, play);

                if (isGameOver) {
                    endGame(player);
                } else {
                    game.currentTurn = game.getNextTurn(player);
                    game.passCount = 0;
                    updateTurnIndicator();
                    updateAIHandDisplay();

                    if (game.currentTurn === 'player') {
                        enableControls(true);
                    } else {
                        setTimeout(() => aiPlay(game.currentTurn), 800);
                    }
                }

                isAnimating = false;
            });
            return;
        }
        
        game.currentTurn = game.getNextTurn(player);
        updateTurnIndicator();
        
        if (game.currentTurn === 'player') {
            enableControls(true);
        } else {
            setTimeout(() => aiPlay(game.currentTurn), 600);
        }
    }

    function animatePlayCards(player, cards, callback) {
        const tableCards = document.getElementById('table-cards');

        if (player === 'player') {
            tableCards.innerHTML = '';
            cards.forEach((card, i) => {
                const img = document.createElement('img');
                img.src = `${CONFIG.cardAssets.pngPath}${card.name}.png`;
                img.style.width = '60px';
                img.style.height = '90px';
                img.style.objectFit = 'contain';
                img.style.animationDelay = `${i * 50}ms`;
                tableCards.appendChild(img);
            });
        } else {
            const lastPlayEl = document.getElementById(`${player === 'leftAI' ? 'left' : 'right'}-last-play`);
            if (lastPlayEl) {
                lastPlayEl.innerHTML = '';
                cards.forEach((card, i) => {
                    const img = document.createElement('img');
                    img.src = `${CONFIG.cardAssets.pngPath}${card.name}.png`;
                    img.alt = card.name;
                    lastPlayEl.appendChild(img);
                });
            }
        }

        setTimeout(callback, 300);
    }

    function enableControls(enabled) {
        const playBtn = document.getElementById('play-btn');
        const passBtn = document.getElementById('pass-btn');
        const hintBtn = document.getElementById('hint-btn');

        hintBtn.disabled = !enabled;
        playBtn.disabled = true;

        updatePlayButton();
    }

    async function endGame(winner) {
        const isVictory = winner === 'player';
        
        const aiLeftCards = game.players.leftAI.cards.length;
        const aiRightCards = game.players.rightAI.cards.length;
        const totalAIRemaining = isVictory ? aiLeftCards + aiRightCards : game.players.player.cards.length;
        
        let rewards;
        if (isVictory) {
            rewards = rankManager.calculateRewards(userData.rank, Math.min(aiLeftCards, aiRightCards));
        } else {
            const myCards = game.players.player.cards.length;
            rewards = rankManager.calculateRewards(userData.rank, -myCards);
        }
        
        const oldRank = { ...userData.rank };
        const newRank = rankManager.addStars(userData.rank, rewards.stars);
        
        userData.points += rewards.points;
        userData.stats.totalGames++;
        if (isVictory) {
            userData.stats.wins++;
            if (totalAIRemaining > 10) {
                userData.stats.perfectWins++;
            }
        }
        userData.rank = newRank;
        
        await auth.updateUserData({
            points: userData.points,
            rank: newRank,
            stats: userData.stats
        });
        
        showResultScreen(isVictory, rewards, aiLeftCards, aiRightCards);
        
        if (rewards.stars > 0 && (newRank.level > oldRank.level || newRank.tier > oldRank.tier)) {
            setTimeout(() => showPromotion(oldRank, newRank), 1500);
        }
        
        if (isVictory) {
            playSound('victory');
        } else {
            playSound('defeat');
        }
    }

    function showResultScreen(isVictory, rewards, aiLeftCards, aiRightCards) {
        const icon = document.getElementById('result-icon');
        const title = document.getElementById('result-title');
        const details = document.getElementById('result-details');
        const starsValue = document.getElementById('reward-stars-value');
        const pointsValue = document.getElementById('reward-points-value');
        
        icon.className = `result-icon ${isVictory ? 'victory' : 'defeat'}`;
        title.className = `result-title ${isVictory ? 'victory' : 'defeat'}`;
        title.textContent = isVictory ? '胜利' : '失败';
        
        if (isVictory) {
            const aiRemaining = aiLeftCards + aiRightCards;
            if (aiRemaining > 10) {
                details.textContent = '完胜！对手剩余很多牌';
            } else if (aiRemaining > 0) {
                details.textContent = '险胜！';
            } else {
                details.textContent = '获胜！';
            }
        } else {
            details.textContent = '再接再厉';
        }
        
        starsValue.textContent = rewards.stars > 0 ? `+${rewards.stars}` : rewards.stars.toString();
        starsValue.className = `reward-value ${rewards.stars < 0 ? 'negative' : ''}`;
        
        pointsValue.textContent = `+${rewards.points}`;
        
        document.getElementById('result-ai-left').textContent = aiLeftCards;
        document.getElementById('result-ai-right').textContent = aiRightCards;
        
        showScreen('result');
    }

    function showPromotion(from, to) {
        const overlay = document.getElementById('promotion-overlay');
        const fromRank = rankManager.getRankInfo(from.level, from.tier);
        const toRank = rankManager.getRankInfo(to.level, to.tier);
        
        document.getElementById('promotion-from').textContent = `${fromRank.name} ${fromRank.tier}阶`;
        document.getElementById('promotion-to').textContent = `${toRank.name} ${toRank.tier}阶`;
        
        overlay.classList.add('active');
        playSound('star');
    }

    function closePromotion() {
        document.getElementById('promotion-overlay').classList.remove('active');
    }

    function returnToHome() {
        playSound('click');
        updateHomeUI();
        showScreen('home');
    }

    function quitGame() {
        if (!confirm('确定要认输吗？')) return;
        
        endGame(game.players.leftAI.isLandowner ? 'leftAI' : 'rightAI');
    }

    function showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`${name}-screen`).classList.add('active');
        currentScreen = name;

        if (name === 'auth') {
            audio.playBgm('login');
        } else if (name === 'game' || name === 'result') {
            audio.playBgm('game');
        } else if (name === 'home' || name === 'match' || name === 'shop' || name === 'profile') {
            audio.playBgm('hall');
        }
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(61, 52, 40, 0.95);
            color: white;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 16px;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    function showErrorDialog(message) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            padding: 30px 40px;
            border-radius: 16px;
            max-width: 320px;
            text-align: center;
            animation: slideUp 0.3s ease;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        `;

        const icon = document.createElement('div');
        icon.innerHTML = '⚠️';
        icon.style.cssText = 'font-size: 48px; margin-bottom: 16px;';

        const title = document.createElement('div');
        title.textContent = '出牌提示';
        title.style.cssText = 'font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px;';

        const msg = document.createElement('div');
        msg.textContent = message;
        msg.style.cssText = 'font-size: 15px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px;';

        const btn = document.createElement('button');
        btn.textContent = '我知道了';
        btn.className = 'btn btn-primary';
        btn.style.cssText = 'width: 100%;';
        btn.onclick = () => {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => overlay.remove(), 300);
        };

        dialog.appendChild(icon);
        dialog.appendChild(title);
        dialog.appendChild(msg);
        dialog.appendChild(btn);
        overlay.appendChild(dialog);
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                btn.click();
            }
        };
        document.body.appendChild(overlay);
    }

    function playSound(type) {
        audio.playSound(type);
    }

    function toggleSound() {
        const muted = audio.toggle();
        document.getElementById('sound-toggle').classList.toggle('muted', muted);
    }

    function showError(message) {
        alert(message);
    }

    window.addEventListener('DOMContentLoaded', init);
})();
