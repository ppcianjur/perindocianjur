export async function extractKTPData(base64Image, db) {
    const setting = await db.prepare("SELECT key_value FROM settings WHERE key_name = 'GEMINI_API_KEY'").first();
    const apiKey = setting?.key_value;

    if (!apiKey) throw new Error("API Key tidak ditemukan.");

    // MENGGUNAKAN ID MODEL GEMINI 3 FLASH PREVIEW (Update Desember 2025)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{
            parts: [
                { text: "Anda adalah asisten OCR khusus KTP Indonesia. Ekstrak data: nik, nama, tempat_lahir, tanggal_lahir, alamat, rt, rw, kelurahan, kecamatan. HANYA berikan output JSON mentah tanpa markdown." },
                { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
        }],
        generationConfig: {
            temperature: 0.1,
            // Gemini 3 mendukung output terstruktur secara native
            responseMimeType: "application/json"
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.error) {
        throw new Error(`Gemini Error (${result.error.code}): ${result.error.message}`);
    }

    if (!result.candidates || !result.candidates[0].content.parts[0].text) {
        throw new Error("Gemini 3 Flash gagal merespon data.");
    }

    const textResponse = result.candidates[0].content.parts[0].text;
    try {
        // Karena kita minta responseMimeType: "application/json", Gemini 3 biasanya kasih JSON bersih
        return JSON.parse(textResponse.replace(/```json|```/g, "").trim());
    } catch (e) {
        console.error("Gagal parse JSON Gemini 3:", textResponse);
        throw new Error("Format JSON tidak valid.");
    }
}

export async function sha1(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-1', buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
