export async function onRequestPost(context) {
    try {
        const req = await context.request.json();
        const db = context.env.DB;

        // Pastikan urutan binding parameter (?) SAMA PERSIS dengan urutan variabel di .bind()
        const query = `
            UPDATE pengurus SET 
                nik = ?, nama = ?, jenis_kelamin = ?, no_hp = ?, jabatan = ?, 
                alamat = ?, tempat_lahir = ?, tanggal_lahir = ?,
                agama = ?, pekerjaan = ?, foto_orang_url = ?, foto_kta = ?,
                kode_desa_lengkap = ? 
            WHERE id = ?
        `;

        await db.prepare(query)
            .bind(
                req.nik, 
                req.nama, 
                req.jenis_kelamin, 
                req.no_hp, 
                req.jabatan,
                req.alamat, 
                req.tempat_lahir, 
                req.tanggal_lahir,
                req.agama,          // Kolom Baru
                req.pekerjaan,      // Kolom Baru
                req.foto_orang_url, // Kolom Update
                req.foto_kta,       // Kolom Baru
                req.kode_desa_lengkap, 
                req.id              // WHERE id
            )
            .run();

        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        // Ini akan menampilkan pesan error detail di Network Tab (Developer Tools) browser
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
    }
}
