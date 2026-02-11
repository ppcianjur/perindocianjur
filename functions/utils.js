export async function extractKTPData(base64Image, db) {
    const setting = await db.prepare("SELECT key_value FROM settings WHERE key_name = 'GEMINI_API_KEY'").first();
    const apiKey = setting?.key_value;

    if (!apiKey) throw new Error("API Key Gemini tidak ditemukan.");

    // URL YANG BENAR: Harus ada /v1/models/ (Sesuai dokumentasi resmi Google)
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{
            parts: [
                { text: "Ekstrak data KTP: nik, nama, tempat_lahir, tanggal_lahir (DD-MM-YYYY), alamat, rt, rw, kelurahan, kecamatan. HANYA JSON." },
                { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
        }],
        generationConfig: {
            temperature: 0.1
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.error) {
        // Jika 404 tetap muncul, kita paksa pakai model-id versi latest
        if (result.error.code === 404) {
            const fallbackUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
            const resRetry = await fetch(fallbackUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const resRetryJson = await resRetry.json();
            if (resRetryJson.error) throw new Error(`Gemini Error: ${resRetryJson.error.message}`);
            return JSON.parse(resRetryJson.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
        }
        throw new Error(`Gemini Error (${result.error.code}): ${result.error.message}`);
    }

    const textResponse = result.candidates[0].content.parts[0].text;
    return JSON.parse(textResponse.replace(/```json|```/g, "").trim());
}

export async function sha1(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-1', buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
