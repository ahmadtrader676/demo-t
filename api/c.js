export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { pair } = req.query;
    const rawPair = pair || "USD/PKR (OTC)";
    
    // Clean key name for Firebase compatibility (replacing / with _)
    const cleanKey = rawPair.replace(/\//g, "_").replace(/[^a-zA-Z0-9_]/g, "");

    const basePrices = {
        "USD_PKR_OTC": 278.5000,
        "USD_INR_OTC": 83.4000,
        "USD_BDT_OTC": 117.2000
    };

    let price = basePrices[cleanKey] || 100.0000;
    const FIREBASE_URL = "https://reactions-maker-site-default-rtdb.firebaseio.com/pr.json";

    try {
        const response = await fetch(FIREBASE_URL);
        if (response.ok) {
            const data = await response.json();
            if (data && data.controls && data.controls[cleanKey]) {
                const item = data.controls[cleanKey];
                
                // If custom price set by Admin directly
                if (item.customPrice !== undefined && item.customPrice !== null) {
                    price = parseFloat(item.customPrice);
                } else if (item.mode === "FORCE_UP") {
                    price += 0.0500;
                } else if (item.mode === "FORCE_DOWN") {
                    price -= 0.0500;
                }
            }
        }
    } catch (e) {
        // Firebase failure handle
    }

    return res.status(200).json({
        pair: rawPair,
        price: parseFloat(price.toFixed(4)),
        timestamp: Date.now()
    });
}
