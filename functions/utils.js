export async function extractKTPData(base64Image, db) {
    const setting = await db.prepare("SELECT key_value FROM settings WHERE key_name = 'GEMINI_API_KEY'").first();
    const apiKey = setting?.key_value;

    if (!apiKey) throw new Error("API Key tidak ditemukan.");

    // URL v1beta dengan prefix models/gemini-1.5-flash
    // Ini adalah endpoint paling fleksibel untuk API Key baru
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{
            parts: [
                { text: "Ekstrak data KTP: nik, nama, tempat_lahir, tanggal_lahir, alamat, rt, rw, kelurahan, kecamatan. HANYA JSON mentah." },
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
        // Jika masih 404/400, kita coba model paling basic sebagai cadangan terakhir
        console.error("Gemini Error Detail:", result.error);
        throw new Error(`Gemini Error: ${result.error.message} (Code: ${result.error.code})`);
    }

    if (!result.candidates || !result.candidates[0].content.parts[0].text) {
        throw new Error("AI tidak merespon teks. Cek gambar.");
    }

    const textResponse = result.candidates[0].content.parts[0].text;
    try {
        const cleanJson = textResponse.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        throw new Error("Data KTP gagal di-parse. Coba foto ulang.");
    }
}

export async function sha1(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-1', buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
