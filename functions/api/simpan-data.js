export async function onRequestPost(context) {
    try {
        const req = await context.request.json();
        const db = context.env.DB;

        // Validasi data kritis
        if (!req.nik || !req.nama || !req.kode_desa_lengkap) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: "Data NIK, Nama, dan Desa (Database) wajib diisi!" 
            }), { status: 400 });
        }

        // Cek Duplikat NIK
        const exist = await db.prepare("SELECT nik FROM pengurus WHERE nik = ?").bind(req.nik).first();
        if (exist) {
            return new Response(JSON.stringify({ 
                success: false, 
                error: `NIK ${req.nik} sudah terdaftar a.n ${exist.nama}` 
            }), { status: 409 });
        }

        // Query Insert
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
                req.nama_desa, 
                req.kode_desa_lengkap, 
                req.foto_url, 
                req.no_hp, 
                req.jabatan, 
                req.creator
            )
            .run();

        return new Response(JSON.stringify({ success: true }));

    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
