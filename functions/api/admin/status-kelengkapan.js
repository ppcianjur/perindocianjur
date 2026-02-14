export async function onRequestGet(context) {
    const db = context.env.DB;

    try {
        // 1. Ambil semua Master Data
        const { results: listKec } = await db.prepare("SELECT kode_kec, nama_kecamatan FROM kecamatan ORDER BY nama_kecamatan ASC").all();
        const { results: listDesa } = await db.prepare("SELECT kode_desa_lengkap, kode_kec, nama_desa FROM desa ORDER BY nama_desa ASC").all();
        
        // 2. Ambil semua data Pengurus (Hanya field yang dibutuhkan)
        // Kita butuh tahu jabatan dan lokasinya
        // Join ke desa untuk tahu kode_kec dari pengurus tersebut
        const { results: listPengurus } = await db.prepare(`
            SELECT p.jabatan, p.kode_desa_lengkap, d.kode_kec 
            FROM pengurus p
            JOIN desa d ON p.kode_desa_lengkap = d.kode_desa_lengkap
        `).all();

        // 3. Proses Logika Kelengkapan
        const report = listKec.map(kec => {
            // Filter pengurus yang ada di kecamatan ini
            const pengurusKec = listPengurus.filter(p => p.kode_kec === kec.kode_kec);

            // A. CEK DPC (Level Kecamatan)
            // Jabatan DPC: Ketua DPC, Sekretaris DPC, Bendahara DPC
            const dpcRoles = ['Ketua DPC', 'Sekretaris DPC', 'Bendahara DPC'];
            const existingDpc = pengurusKec.map(p => p.jabatan).filter(j => dpcRoles.includes(j));
            
            // Cari yang hilang
            const missingDpc = dpcRoles.filter(role => !existingDpc.includes(role));
            
            let statusDpc = "";
            let missingDpcText = [];

            if (existingDpc.length === 0) {
                statusDpc = "KOSONG";
            } else if (missingDpc.length === 0) {
                statusDpc = "LENGKAP";
            } else {
                statusDpc = "KURANG";
                missingDpcText = missingDpc;
            }

            // B. CEK DPRT (Level Desa)
            // Filter desa yang ada di kecamatan ini
            const desasInKec = listDesa.filter(d => d.kode_kec === kec.kode_kec);
            
            const desaReports = desasInKec.map(desa => {
                const pengurusDesa = pengurusKec.filter(p => p.kode_desa_lengkap === desa.kode_desa_lengkap);
                
                // Jabatan DPRT: Ketua, Sekretaris, Bendahara (Sesuai value di user.html)
                const dprtRoles = ['Ketua', 'Sekretaris', 'Bendahara']; 
                // Catatan: Di user.html valuenya 'Ketua', 'Sekretaris', 'Bendahara'. 
                // Jika di database tersimpan 'Ketua DPRT', sesuaikan array ini.
                
                const existingDprt = pengurusDesa.map(p => p.jabatan).filter(j => dprtRoles.includes(j));
                const missingDprt = dprtRoles.filter(role => !existingDprt.includes(role));

                let statusDesa = "";
                let missingDesaText = [];

                if (existingDprt.length === 0) {
                    statusDesa = "KOSONG";
                } else if (missingDprt.length === 0) {
                    statusDesa = "LENGKAP";
                } else {
                    statusDesa = "KURANG";
                    missingDesaText = missingDprt;
                }

                return {
                    nama_desa: desa.nama_desa,
                    status: statusDesa,
                    missing: missingDesaText
                };
            });

            return {
                nama_kecamatan: kec.nama_kecamatan,
                status_dpc: statusDpc,
                missing_dpc: missingDpcText,
                desas: desaReports
            };
        });

        return new Response(JSON.stringify(report), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
