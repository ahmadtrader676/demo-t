// Serverless Backend OTC Market Engine
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { pair } = req.query;
    const targetPair = pair || "USD/PKR (OTC)";

    // Default base prices
    const basePrices = {
        "USD/PKR (OTC)": 278.50,
        "USD/INR (OTC)": 83.40,
        "USD/BDT (OTC)": 117.20,
        "USD/BRL (OTC)": 5.45,
        "USD/ARS (OTC)": 920.10
    };

    let basePrice = basePrices[targetPair] || 100.00;
    const FIREBASE_DB_URL = "https://reactions-maker-site-default-rtdb.firebaseio.com/pr.json";

    let adminTrend = "NEUTRAL"; // Defaults to NEUTRAL if not configured in DB

    try {
        // Fetch Admin Manipulation Settings from Firebase
        const fbRes = await fetch(FIREBASE_DB_URL);
        if (fbRes.ok) {
            const dbData = await fbRes.json();
            if (dbData && dbData.trends && dbData.trends[targetPair]) {
                adminTrend = dbData.trends[targetPair];
            }
        }
    } catch (e) {
        // Fallback to algorithmic generation if DB fetch times out
    }

    // --- MANIPULATION & RANDOM WALK ALGORITHM ---
    let randomNoise = (Math.random() - 0.495) * (basePrice * 0.001);

    // Apply Admin Trend Bias
    if (adminTrend === "FORCE_UP") {
        randomNoise += (basePrice * 0.0008); // Push candle UP
    } else if (adminTrend === "FORCE_DOWN") {
        randomNoise -= (basePrice * 0.0008); // Push candle DOWN
    }

    const calculatedPrice = basePrice + randomNoise;

    return res.status(200).json({
        pair: targetPair,
        price: parseFloat(calculatedPrice.toFixed(4)),
        trendMode: adminTrend,
        timestamp: Date.now()
    });
}
