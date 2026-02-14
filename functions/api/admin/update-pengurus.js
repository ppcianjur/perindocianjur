export async function onRequestPost(context) {
    try {
        const req = await context.request.json();
        const db = context.env.DB;

        // --- DEBUG LOG: Cek data yang diterima server ---
        console.log("Update Request Received:", JSON.stringify(req, null, 2));

        if (!req.id) {
            throw new Error("ID Pengurus (req.id) tidak ditemukan atau kosong.");
        }

        // --- FIX LOGIC: Ubah undefined menjadi null ---
        // D1 akan error jika kita bind variable yang 'undefined'.
        // Kita paksa jadi 'null' jika data tidak dikirim frontend.
        const values = [
            req.nik || null,
            req.nama || null,
            req.jenis_kelamin || null,
            req.no_hp || null,
            req.jabatan || null,
            req.alamat || null,
            req.tempat_lahir || null,
            req.tanggal_lahir || null,
            req.agama || null,          // Kolom Baru
            req.pekerjaan || null,      // Kolom Baru
            req.foto_orang_url || null, // Kolom Update
            req.foto_kta || null,       // Kolom Baru
            req.kode_desa_lengkap || null,
            req.id
        ];

        // --- DEBUG LOG: Cek nilai yang akan dimasukkan ke DB ---
        // Hitung jumlah parameter (?) dan jumlah values harus sama (14)
        console.log(`Binding Values (${values.length} items):`, JSON.stringify(values));

        const query = `
            UPDATE pengurus SET 
                nik = ?, nama = ?, jenis_kelamin = ?, no_hp = ?, jabatan = ?, 
                alamat = ?, tempat_lahir = ?, tanggal_lahir = ?,
                agama = ?, pekerjaan = ?, foto_orang_url = ?, foto_kta = ?,
                kode_desa_lengkap = ? 
            WHERE id = ?
        `;

        await db.prepare(query)
            .bind(...values)
            .run();

        return new Response(JSON.stringify({ success: true, message: "Update Berhasil" }));

    } catch (e) {
        // LOG ERROR KE CONSOLE SERVER
        console.error("CRITICAL ERROR di update-pengurus:", e);

        // KEMBALIKAN PESAN ERROR LENGKAP KE FRONTEND (Agar muncul di inspect element / alert)
        return new Response(JSON.stringify({ 
            success: false, 
            error: "DB Error: " + e.message, // Pesan error asli dari database
            details: e.cause || "Cek apakah kolom agama/pekerjaan/foto_kta sudah dibuat di database?"
        }), { 
            status: 500, // Tetap 500 agar ketahuan error server
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
