export async function extractKTPData(base64Image, db) {
    const setting = await db.prepare("SELECT key_value FROM settings WHERE key_name = 'GEMINI_API_KEY'").first();
    const apiKey = setting?.key_value;

    if (!apiKey) throw new Error("API Key tidak ditemukan.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{
            parts: [
                // PERBAIKAN: Menambahkan 'jenis_kelamin' ke prompt
                { text: "Ekstrak data KTP: nik, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat, rt, rw, kelurahan, kecamatan. HANYA JSON mentah." },
                { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
        }],
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.error) throw new Error(result.error.message);
    if (!result.candidates || !result.candidates[0].content.parts[0].text) throw new Error("AI gagal merespon.");

    const textResponse = result.candidates[0].content.parts[0].text;
    try {
        return JSON.parse(textResponse.replace(/```json|```/g, "").trim());
    } catch (e) {
        throw new Error("Gagal parsing data KTP.");
    }
}

export async function sha1(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-1', buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
