export async function onRequestPost(context) {
    try {
        const { nik } = await context.request.json();
        const db = context.env.DB;

        // Cek apakah NIK ada
        const user = await db.prepare(`
            SELECT id, nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, 
                   agama, pekerjaan, alamat, rt, rw, kelurahan as nama_desa, 
                   (SELECT nama_kecamatan FROM kecamatan k 
                    JOIN desa d ON k.kode_kec = d.kode_kec 
                    WHERE d.kode_desa_lengkap = pengurus.kode_desa_lengkap) as nama_kecamatan,
                   no_hp 
            FROM pengurus 
            WHERE nik = ?
        `).bind(nik).first();

        if (!user) {
            return new Response(JSON.stringify({ success: false, error: "NIK tidak ditemukan dalam database." }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true, data: user }));

    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
    }
}
