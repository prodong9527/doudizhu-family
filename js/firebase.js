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
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 导出数据库实例
export { db, collection, addDoc, getDocs, doc, updateDoc };