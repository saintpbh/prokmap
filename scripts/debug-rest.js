const url = "https://prokworldmap-default-rtdb.asia-southeast1.firebasedatabase.app/missionaries.json";

async function check() {
    try {
        console.log('Fetching all data...');
        const response = await fetch(url);
        const data = await response.json();

        if (!data) {
            console.log('No data found');
            return;
        }

        const matches = [];
        Object.keys(data).forEach(key => {
            if (data[key].name === '류숙') {
                matches.push({
                    id: key,
                    ...data[key]
                });
            }
        });

        console.log(`Found ${matches.length} entries for 류숙`);
        matches.forEach(m => {
            console.log(`ID: ${m.id}`);
            console.log(`Name: ${m.name}`);
            console.log(`Email: ${m.email}`);
            console.log(`Status: ${m.status}`);
            console.log('----------');
        });

    } catch (e) {
        console.error(e);
    }
}

check();
