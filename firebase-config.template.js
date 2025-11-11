// Firebase 配置檔案模板
// Firebase Configuration Template
// 複製此檔案為 firebase-config.js 並填入您的實際配置
// Copy this file to firebase-config.js and fill in your actual configuration

const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012345"
};

// Firebase 初始化和資料庫操作函數
// Firebase initialization and database operation functions
class FirebaseManager {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    // 初始化 Firebase
    async init() {
        try {
            // 確保 Firebase SDK 已載入
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK not loaded');
            }

            // 初始化 Firebase 應用程式
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            // 獲取資料庫參考
            this.db = firebase.database();
            this.initialized = true;
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            return false;
        }
    }

    // 記錄地墊按下事件
    async logMatPress(timestamp, groupId, matNumber) {
        if (!this.initialized) {
            console.warn('Firebase not initialized, cannot log data');
            return false;
        }

        try {
            const pressData = {
                timestamp: timestamp,
                groupId: groupId,
                matNumber: matNumber,
                date: new Date().toISOString(),
                sessionId: this.getSessionId()
            };

            // 將資料推送到 Realtime Database
            const pressesRef = this.db.ref('mat_presses');
            await pressesRef.push(pressData);
            
            console.log('Mat press logged to Firebase:', pressData);
            return true;
        } catch (error) {
            console.error('Failed to log mat press:', error);
            return false;
        }
    }

    // 獲取或生成會話ID
    getSessionId() {
        let sessionId = sessionStorage.getItem('mat_simulator_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('mat_simulator_session_id', sessionId);
        }
        return sessionId;
    }

    // 獲取歷史記錄
    async getMatPressHistory(limit = 50) {
        if (!this.initialized) {
            console.warn('Firebase not initialized');
            return [];
        }

        try {
            const pressesRef = this.db.ref('mat_presses');
            const snapshot = await pressesRef.orderByChild('date').limitToLast(limit).once('value');
            
            const history = [];
            snapshot.forEach(childSnapshot => {
                history.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            return history.reverse(); // 最新的在前
        } catch (error) {
            console.error('Failed to get history:', error);
            return [];
        }
    }
}

// 建立全域 Firebase 管理器實例
const firebaseManager = new FirebaseManager();