export async function onRequestPost(context) {
    try {
        const req = await context.request.json();
        const db = context.env.DB;

        if (!req.nik || !req.nama || !req.kode_desa_lengkap) {
            return new Response(JSON.stringify({ success: false, error: "Data wajib tidak lengkap." }), { status: 400 });
        }

        // Cek Duplikat
        const exist = await db.prepare("SELECT nik FROM pengurus WHERE nik = ?").bind(req.nik).first();
        if (exist) {
            return new Response(JSON.stringify({ success: false, error: "NIK sudah terdaftar." }), { status: 409 });
        }

        // PERBAIKAN: Menambahkan kolom jenis_kelamin
        const query = `
            INSERT INTO pengurus (
                nik, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, 
                alamat, rt, rw, kelurahan, 
                kode_desa_lengkap, foto_url, foto_orang_url, no_hp, 
                jabatan, creator, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        `;

        await db.prepare(query)
            .bind(
                req.nik, req.nama.toUpperCase(), req.jenis_kelamin, req.tempat_lahir, req.tanggal_lahir,
                req.alamat, req.rt, req.rw, req.nama_desa, 
                req.kode_desa_lengkap, req.foto_url, req.foto_orang_url, req.no_hp, 
                req.jabatan, req.creator
            )
            .run();

        return new Response(JSON.stringify({ success: true }));

    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
