export async function extractKTPData(base64Image, db) {
    const setting = await db.prepare("SELECT key_value FROM settings WHERE key_name = 'GEMINI_API_KEY'").first();
    const apiKey = setting?.key_value;

    if (!apiKey) throw new Error("API Key Gemini tidak ditemukan di tabel settings.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{
            parts: [
                { text: "Ekstrak data KTP ke JSON: nik, nama, tempat_lahir, tanggal_lahir, alamat, rt, rw, kelurahan, kecamatan. HANYA JSON." },
                { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
        }]
    };

    console.log("Requesting Gemini with API Key:", apiKey.substring(0, 5) + "...");

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.error) {
        console.error("Gemini API Error Detail:", result.error);
        throw new Error(`Gemini Error: ${result.error.message}`);
    }

    if (!result.candidates) {
        console.error("Gemini No Candidates. Full Response:", JSON.stringify(result));
        throw new Error("Gemini tidak memberikan respon (No Candidates).");
    }

    const text = result.candidates[0].content.parts[0].text;
    return JSON.parse(text.replace(/```json|```/g, "").trim());
}

export async function sha1(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-1', buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
