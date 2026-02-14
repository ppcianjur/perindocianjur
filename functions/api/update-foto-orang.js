export async function onRequestPost(context) {
    try {
        const { id, foto_url, type } = await context.request.json();
        const db = context.env.DB;

        // Tentukan kolom mana yang mau diupdate
        let column = 'foto_orang_url'; // Default Selfie
        if (type === 'kta') {
            column = 'foto_kta';
        }

        // Query dinamis
        const query = `UPDATE pengurus SET ${column} = ? WHERE id = ?`;
        
        await db.prepare(query).bind(foto_url, id).run();

        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
    }
}
