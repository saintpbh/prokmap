const firebase = require('firebase/app');
require('firebase/database');

const firebaseConfig = {
    apiKey: "AIzaSyCrJIhyTYQ4bTUW4jarFqluD97xKao2kF0",
    authDomain: "prokworldmap.firebaseapp.com",
    databaseURL: "https://prokworldmap-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "prokworldmap",
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

async function checkDuplicates() {
    console.log('Fetching missionaries...');
    const snapshot = await firebase.database().ref('missionaries').orderByChild('name').equalTo('류숙').once('value');
    const data = snapshot.val();

    if (!data) {
        console.log('No data found for 류숙');
    } else {
        console.log('Found entries:', Object.keys(data).length);
        Object.keys(data).forEach(key => {
            const m = data[key];
            console.log(`ID: ${key}`);
            console.log(`Name: ${m.name}`);
            console.log(`Index: ${m.id}`); // Check if there's an internal ID field
            console.log(`Status: ${m.status}`);
            console.log('-------------------');
        });
    }
    process.exit();
}

checkDuplicates();
