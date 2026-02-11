export async function onRequestPost(context) {
    const { id, foto_url } = await context.request.json();
    try {
        await context.env.DB.prepare("UPDATE pengurus SET foto_orang_url = ? WHERE id = ?")
            .bind(foto_url, id).run();
        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
    }
}
