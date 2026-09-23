export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = [
      "https://i-gravity.jp",
      "https://www.i-gravity.jp"
    ];

    const corsHeaders = {
      "Access-Control-Allow-Origin":
        allowedOrigins.includes(origin) ? origin : "https://i-gravity.jp",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (request.method !== "POST") {
      return Response.json(
        { ok: false, error: "Method Not Allowed" },
        { status: 405, headers: corsHeaders }
      );
    }

    if (origin && !allowedOrigins.includes(origin)) {
      return Response.json(
        { ok: false, error: "Forbidden" },
        { status: 403, headers: corsHeaders }
      );
    }

    try {
      const contentType = request.headers.get("content-type") || "";
      let form;

      if (contentType.includes("application/json")) {
        form = await request.json();
      } else {
        const data = await request.formData();
        form = Object.fromEntries(data.entries());
      }

      const company = String(form.company || "").trim();
      const name = String(form.name || "").trim();
      const email = String(form.email || "").trim();
      const phone = String(form.phone || "").trim();
      const category = String(form.category || form.type || "").trim();
      const message = String(form.message || "").trim();

      if (!name || !email || !message) {
        return Response.json(
          { ok: false, error: "必須項目を入力してください。" },
          { status: 400, headers: corsHeaders }
        );
      }

      const escapeHtml = (value) =>
        String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");

      const html = `
        <h2>株式会社i-グラビティ Webサイトからのお問い合わせ</h2>
        <p><strong>会社名：</strong>${escapeHtml(company || "未入力")}</p>
        <p><strong>お名前：</strong>${escapeHtml(name)}</p>
        <p><strong>メール：</strong>${escapeHtml(email)}</p>
        <p><strong>電話番号：</strong>${escapeHtml(phone || "未入力")}</p>
        <p><strong>ご相談内容：</strong>${escapeHtml(category || "未選択")}</p>
        <p><strong>現場情報・ご相談内容：</strong></p>
        <p>${escapeHtml(message).replaceAll("\n", "<br>")}</p>
      `;

      const resendResponse = await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "i-グラビティ お問い合わせ <contact@i-gravity.jp>",
            to: [
              "yutahiroko0408@gmail.com",
              "igravity.20260305@gmail.com"
            ],
            reply_to: email,
            subject: `【i-グラビティHP】お問い合わせ：${company || name}`,
            html: html
          })
        }
      );

      const result = await resendResponse.json();

      if (!resendResponse.ok) {
        console.error("Resend error:", result);

        return Response.json(
          { ok: false, error: "メール送信に失敗しました。" },
          { status: 502, headers: corsHeaders }
        );
      }

      return Response.json(
        { ok: true },
        { status: 200, headers: corsHeaders }
      );

    } catch (error) {
      console.error("Worker error:", error);

      return Response.json(
        { ok: false, error: "送信処理でエラーが発生しました。" },
        { status: 500, headers: corsHeaders }
      );
    }
  }
};
