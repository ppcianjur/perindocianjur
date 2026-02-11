export async function extractKTPData(base64Image, db) {
    const setting = await db.prepare("SELECT key_value FROM settings WHERE key_name = 'GEMINI_API_KEY'").first();
    const apiKey = setting?.key_value;

    if (!apiKey) throw new Error("API Key Gemini tidak ditemukan di tabel settings.");

    // Gunakan v1 standar
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{
            parts: [
                { text: "Ekstrak data KTP: nik, nama, tempat_lahir, tanggal_lahir (DD-MM-YYYY), alamat, rt, rw, kelurahan, kecamatan. HANYA berikan output JSON mentah tanpa markdown atau teks lain." },
                { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
        }],
        generationConfig: {
            temperature: 0.1
            // Field responseMimeType dihapus untuk menghindari error skema API v1
        }
    };

    console.log("Mengirim request ke Gemini v1...");

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.error) {
        console.error("Gemini Error:", result.error);
        throw new Error(`Gemini Error (${result.error.code}): ${result.error.message}`);
    }

    if (!result.candidates || !result.candidates[0].content.parts[0].text) {
        throw new Error("AI tidak memberikan respon teks. Coba foto lebih jelas.");
    }

    const textResponse = result.candidates[0].content.parts[0].text;
    
    try {
        // Membersihkan karakter aneh atau markdown yang mungkin diselipkan AI
        const cleanJson = textResponse.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Gagal parse JSON. Raw:", textResponse);
        throw new Error("Format data AI tidak valid. Ulangi pengambilan foto.");
    }
}

export async function sha1(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-1', buffer);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
