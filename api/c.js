// Serverless High-Frequency Market Stream Backend
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { pair } = req.query;
    const targetPair = pair || "USD/PKR (OTC)";

    const basePrices = {
        "USD/PKR (OTC)": 278.50,
        "USD/INR (OTC)": 83.40,
        "USD/BDT (OTC)": 117.20,
        "USD/BRL (OTC)": 5.45,
        "USD/ARS (OTC)": 920.10
    };

    let price = basePrices[targetPair] || 100.00;
    const FIREBASE_URL = "https://reactions-maker-site-default-rtdb.firebaseio.com/pr.json";

    let forceMode = "NEUTRAL";
    let spike = 0;

    try {
        const response = await fetch(FIREBASE_URL);
        if (response.ok) {
            const data = await response.json();
            if (data && data.controls && data.controls[targetPair]) {
                forceMode = data.controls[targetPair].mode || "NEUTRAL";
                spike = parseFloat(data.controls[targetPair].spike || 0);
            }
        }
    } catch (e) {
        // Fallback smooth random engine
    }

    // Calculation Engine
    let delta = (Math.random() - 0.496) * (price * 0.0008);

    if (forceMode === "FORCE_UP") {
        delta += Math.abs(price * 0.0006);
    } else if (forceMode === "FORCE_DOWN") {
        delta -= Math.abs(price * 0.0006);
    }

    price = price + delta + spike;

    return res.status(200).json({
        pair: targetPair,
        price: parseFloat(price.toFixed(4)),
        mode: forceMode,
        timestamp: Date.now()
    });
}
