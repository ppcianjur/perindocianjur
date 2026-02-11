// functions/utils.js

export async function sha1(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-1', buffer);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function extractKTPData(base64Image, db) {
    const setting = await db.prepare("SELECT key_value FROM settings WHERE key_name = 'GEMINI_API_KEY'").first();
    const apiKey = setting?.key_value;

    if (!apiKey) throw new Error("API Key tidak ditemukan di Database.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const strictPrompt = `Anda adalah asisten OCR khusus untuk KTP Indonesia. Ekstrak data: nik (16 digit), nama, tempat_lahir, tanggal_lahir (DD-MM-YYYY), alamat, rt, rw, kelurahan, kecamatan. Output HANYA JSON mentah tanpa markdown.`;

    const payload = {
        contents: [{
            parts: [
                { text: strictPrompt },
                { inline_data: { mime_type: "image/jpeg", data: base64Image.trim() } }
            ]
        }],
        generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024,
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    // Jika Gemini kirim error balik (misal: API Key salah atau Model busy)
    if (result.error) {
        throw new Error(`Gemini API Error: ${result.error.message}`);
    }

    if (!result.candidates || !result.candidates[0].content.parts[0].text) {
        throw new Error("Gemini gagal mengenali gambar. Pastikan foto KTP jelas dan terang.");
    }

    const textResponse = result.candidates[0].content.parts[0].text;
    
    try {
        const cleanJson = textResponse.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        throw new Error("Gagal memproses data KTP. Silakan ulangi foto.");
    }
}
