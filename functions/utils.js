// Helper SHA1 untuk Cloudinary Signature
export async function sha1(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-1', buffer);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Fungsi OCR KTP via Gemini AI dengan Prompt Ketat
export async function extractKTPData(base64Image, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // Prompt yang Anda minta disisipkan di sini
    const strictPrompt = `Anda adalah asisten OCR khusus untuk KTP Indonesia. Tugas Anda adalah mengekstrak data dari gambar KTP secara akurat.

Ekstrak: NIK (16 digit), Nama, Tempat Lahir, Tanggal Lahir, Alamat, RT, RW, Kelurahan, Kecamatan.
Format Tanggal harus: DD-MM-YYYY.
Jika ada teks yang buram, tulis 'TIDAK TERBACA'.
HANYA berikan output dalam format JSON mentah tanpa penjelasan atau markdown seperti ini:
{"nik": "...", "nama": "...", "tempat_lahir": "...", "tanggal_lahir": "...", "alamat": "...", "rt": "...", "rw": "...", "kelurahan": "...", "kecamatan": "..."}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: strictPrompt },
                    { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                ]
            }]
        })
    });

    const result = await response.json();
    
    if (!result.candidates || result.candidates.length === 0) {
        throw new Error("Gemini tidak memberikan respon. Pastikan API Key valid.");
    }

    const textResponse = result.candidates[0].content.parts[0].text;
    
    try {
        // Membersihkan jika Gemini masih nekat memberikan markdown ```json
        const cleanJson = textResponse.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Raw Response:", textResponse);
        throw new Error("Gagal parsing JSON dari Gemini. Format output tidak sesuai.");
    }
}
