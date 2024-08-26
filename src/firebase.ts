import type { Firestore } from 'firebase/firestore';
import type { RemoteConfig } from 'firebase/remote-config';

const firebaseConfig = {
    apiKey: "AIzaSyDmY414SUin3MCCcHBsrGuNm7qv-a_4Ghs",
    authDomain: "dnd-chef.firebaseapp.com",
    projectId: "dnd-chef",
    storageBucket: "dnd-chef.appspot.com",
    messagingSenderId: "252269096400",
    appId: "1:252269096400:web:3dc58696b2ed6629971dd5"
};

let db: Firestore;
let remoteConfig: RemoteConfig

async function loadFirestore() {
    if (!db) {
        const { initializeApp } = await import('firebase/app');
        const { getFirestore } = await import('firebase/firestore');

        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    }

    return db;
}

async function loadRemoteConfig() {
    if (!remoteConfig) {
        const { initializeApp } = await import('firebase/app');
        const { getRemoteConfig } = await import("firebase/remote-config");
        const app = initializeApp(firebaseConfig);
        remoteConfig = getRemoteConfig(app);
        remoteConfig.settings.minimumFetchIntervalMillis = 3600000;
        remoteConfig.defaultConfig = {
            "dnd_day": "tuesday"
        };
    }
    return remoteConfig
}

export { loadFirestore, loadRemoteConfig };