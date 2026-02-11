export async function onRequestPost(context) {
    try {
        const req = await context.request.json();
        const db = context.env.DB;

        // PERBAIKAN: Menambahkan update jenis_kelamin
        const query = `
            UPDATE pengurus SET 
                nik = ?, nama = ?, jenis_kelamin = ?, no_hp = ?, jabatan = ?, 
                alamat = ?, tempat_lahir = ?, tanggal_lahir = ?,
                kode_desa_lengkap = ? 
            WHERE id = ?
        `;

        await db.prepare(query)
            .bind(
                req.nik, req.nama, req.jenis_kelamin, req.no_hp, req.jabatan,
                req.alamat, req.tempat_lahir, req.tanggal_lahir,
                req.kode_desa_lengkap, req.id
            )
            .run();

        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
    }
}
