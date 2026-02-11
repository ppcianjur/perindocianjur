export async function onRequestPost(context) {
    try {
        const req = await context.request.json();
        const db = context.env.DB;

        // Validasi Wajib
        if (!req.nik || !req.nama || !req.kode_desa_lengkap) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: "Data NIK, Nama, dan Desa wajib diisi." 
            }), { status: 400 });
        }

        // Cek duplikasi NIK
        const exist = await db.prepare("SELECT nik FROM pengurus WHERE nik = ?").bind(req.nik).first();
        if (exist) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: "NIK sudah terdaftar sebelumnya." 
            }), { status: 409 });
        }

        // Query Insert sesuai struktur tabel perindo1.sql
        // Kita simpan kode_desa_lengkap sebagai Foreign Key
        const query = `
            INSERT INTO pengurus (
                nik, nama, tempat_lahir, tanggal_lahir, 
                alamat, rt, rw, kelurahan, 
                kode_desa_lengkap, foto_url, no_hp, 
                jabatan, creator, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        `;

        await db.prepare(query)
            .bind(
                req.nik, 
                req.nama.toUpperCase(), 
                req.tempat_lahir, 
                req.tanggal_lahir,
                req.alamat, 
                req.rt, 
                req.rw, 
                req.nama_desa, // Simpan nama teksnya juga untuk display cepat (opsional, sesuai kolom kelurahan)
                req.kode_desa_lengkap, // INI PENTING (Foreign Key)
                req.foto_url, 
                req.no_hp, 
                req.jabatan, 
                req.creator
            )
            .run();

        return new Response(JSON.stringify({ success: true }));

    } catch (err) {
        console.error("DB Error:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
