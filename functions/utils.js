export async function extractKTPData(base64Image, db) {
    const setting = await db.prepare("SELECT key_value FROM settings WHERE key_name = 'GEMINI_API_KEY'").first();
    const apiKey = setting?.key_value;

    if (!apiKey) throw new Error("API Key Gemini tidak ditemukan di tabel settings.");

    // Gunakan versi v1 (lebih stabil) dan path model yang benar
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{
            parts: [
                { text: "Anda adalah asisten OCR KTP Indonesia. Ekstrak data: nik, nama, tempat_lahir, tanggal_lahir (DD-MM-YYYY), alamat, rt, rw, kelurahan, kecamatan. HANYA JSON mentah tanpa markdown." },
                { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
        }],
        generationConfig: {
            temperature: 0.1,
            response_mime_type: "application/json" // Memaksa output JSON jika didukung
        }
    };

    console.log("Menghubungi Gemini v1...");

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.error) {
        console.error("Gemini Error Detail:", result.error);
        throw new Error(`Gemini Error (${result.error.code}): ${result.error.message}`);
    }

    if (!result.candidates || !result.candidates[0].content.parts[0].text) {
        throw new Error("Gemini tidak memberikan hasil ekstraksi.");
    }

    let textResponse = result.candidates[0].content.parts[0].text;
    
    try {
        // Membersihkan jika masih ada backticks
        const cleanJson = textResponse.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Raw AI Response:", textResponse);
        throw new Error("Format JSON AI rusak. Coba foto lebih tegak.");
    }
}

// Fungsi sha1 tetap sama
export async function sha1(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-1', buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
