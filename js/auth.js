import { db } from './firebase.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyBmQhXH1AwLW-eaEnaWOOnZONIzDRlN3Ec",
  authDomain: "doudizhu-family.firebaseapp.com",
  projectId: "doudizhu-family",
  storageBucket: "doudizhu-family.firebasestorage.app",
  messagingSenderId: "662307632607",
  appId: "1:662307632607:web:4acd599dae96f3e6ac406a",
  measurementId: "G-3Z5GGGD541"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

class AuthManager {
    constructor() {
        this.db = db;
        this.user = null;
        this.userData = null;
        this.isGuest = false;
        this.storageKey = 'doudizhu_guest_data';
        this.initAuth();
    }

    initAuth() {
        onAuthStateChanged(auth, (user) => {
            this.user = user;
            if (user) {
                this.isGuest = false;
                this.loadUserData();
            }
        });
    }

    async register(username, password) {
        const email = `${username}@doudizhu.local`;
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;

            const initialData = {
                username,
                rank: { level: 0, tier: 0, stars: 0, totalStars: 0 },
                points: 100,
                skins: ['default'],
                currentSkin: 'default',
                stats: { totalGames: 0, wins: 0, perfectWins: 0 },
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp()
            };

            await setDoc(doc(this.db, 'users', user.uid), initialData);
            this.userData = initialData;
            return { success: true, data: initialData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async login(username, password) {
        const email = `${username}@doudizhu.local`;
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    enterGuestMode() {
        this.isGuest = true;
        const savedData = localStorage.getItem(this.storageKey);

        if (savedData) {
            try {
                this.userData = JSON.parse(savedData);
            } catch {
                this.userData = this.createGuestInitialData();
            }
        } else {
            this.userData = this.createGuestInitialData();
        }

        this.saveGuestData();
        return { success: true, data: this.userData };
    }

    createGuestInitialData() {
        const guestNum = Math.floor(Math.random() * 9000) + 1000;
        return {
            username: `游客${guestNum}`,
            isGuest: true,
            rank: { level: 0, tier: 0, stars: 0, totalStars: 0 },
            points: 100,
            skins: ['default'],
            currentSkin: 'default',
            stats: { totalGames: 0, wins: 0, perfectWins: 0 }
        };
    }

    saveGuestData() {
        if (this.isGuest && this.userData) {
            localStorage.setItem(this.storageKey, JSON.stringify(this.userData));
        }
    }

    clearGuestData() {
        localStorage.removeItem(this.storageKey);
    }

    async loadUserData() {
        if (!this.user) return null;
        try {
            const userDoc = doc(this.db, 'users', this.user.uid);
            const docSnap = await getDoc(userDoc);
            if (docSnap.exists()) {
                this.userData = docSnap.data();
                return this.userData;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
        return null;
    }

    async updateUserData(data) {
        if (this.isGuest) {
            this.userData = { ...this.userData, ...data };
            this.saveGuestData();
            return true;
        }

        if (!this.user) return false;
        try {
            const userDoc = doc(this.db, 'users', this.user.uid);
            await updateDoc(userDoc, {
                ...data,
                lastLoginAt: serverTimestamp()
            });
            this.userData = { ...this.userData, ...data };
            return true;
        } catch (error) {
            console.error('Error updating user data:', error);
            return false;
        }
    }

    async logout() {
        if (this.isGuest) {
            this.clearGuestData();
            this.isGuest = false;
            this.userData = null;
            return true;
        }

        try {
            await signOut(auth);
            this.user = null;
            this.userData = null;
            return true;
        } catch (error) {
            console.error('Error logging out:', error);
            return false;
        }
    }

    isLoggedIn() {
        return !!this.user || this.isGuest;
    }

    isGuestUser() {
        return this.isGuest;
    }

    getUserId() {
        return this.user ? this.user.uid : (this.isGuest ? 'guest' : null);
    }

    getUserData() {
        return this.userData;
    }
}

export { AuthManager };
window.AuthManager = AuthManager;
