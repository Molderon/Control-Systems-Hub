exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    if (!process.env.DISCORD_WEBHOOK_URL) {
        console.error("DISCORD_WEBHOOK_URL is not set.");
        return { statusCode: 500, body: JSON.stringify({ status: "Error", message: "Webhook not configured." }) };
    }

    try {
        const params = new URLSearchParams(event.body);

        if (params.get('bot-field')) {
            console.log("Bot detected via honeypot. Dropping transmission.");
            return { statusCode: 200, body: JSON.stringify({ status: "Filtered" }) };
        }

        function sanitize(val, maxLen) {
            return String(val || '').slice(0, maxLen).replace(/@(everyone|here)/gi, '[@]$1');
        }

        const name    = sanitize(params.get('name'),    100) || 'Anonymous Operator';
        const email   = sanitize(params.get('email'),   254) || 'No Email Provided';
        const subject = sanitize(params.get('subject'), 200) || 'No Subject';
        const message = sanitize(params.get('message'), 900) || 'No Message Content';

        const discordResponse = await fetch(process.env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: "📡 **NEW SYSTEM TRANSMISSION DETECTED**",
                embeds: [{
                    title: `Subject: ${subject}`,
                    color: 0x00ffff,
                    fields: [
                        { name: "Operator", value: name,    inline: true },
                        { name: "Contact",  value: email,   inline: true },
                        { name: "Message",  value: `\`\`\`${message}\`\`\`` }
                    ],
                    footer: { text: "ControlSystems.sh | TU-Sofia Branch Plovdiv" },
                    timestamp: new Date().toISOString()
                }]
            })
        });

        if (!discordResponse.ok) {
            throw new Error(`Discord API responded with ${discordResponse.status}`);
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Success", message: "Transmission Received" })
        };

    } catch (err) {
        console.error("Relay Error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ status: "Error", message: "Internal Relay Failure" })
        };
    }
};
