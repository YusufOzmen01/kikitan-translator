import { invoke } from "@tauri-apps/api/core";
import { calculateMinWaitTime } from "./constants";

let ws_connection: WebSocket | null = null;

function draw_text_on_canvas(text: string): string {
    const canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    ctx = ctx!;

    canvas.width = 5000;
    canvas.height = 1500;

    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '500px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxTextWidth = canvas.width;
    const maxTextHeigth = canvas.height;
    const maxLines = 8;
    const minTextSize = 200;

    let currentText = text;

    while ((ctx.measureText(currentText).width > maxTextWidth || ctx.measureText(currentText).actualBoundingBoxAscent + ctx.measureText(currentText).actualBoundingBoxDescent > maxTextHeigth) && parseInt(ctx.font) > minTextSize) {
        ctx.font = parseInt(ctx.font) - 1 + 'px serif';
    }

    if ((ctx.measureText(currentText).width > maxTextWidth || ctx.measureText(currentText).actualBoundingBoxAscent + ctx.measureText(currentText).actualBoundingBoxDescent > maxTextHeigth)) {
        const words = currentText.split(' ');

        let lines = [];
        let newText = '';
        for (let i = 0; i < words.length; i++) {
            if (ctx.measureText(newText + words[i] + ' ').width > maxTextWidth) {
                lines.push(newText.trim());

                newText = '';
            }

            newText += words[i] + ' ';
        }

        if (newText.trim() !== '') {
            lines.push(newText.trim());
        }

        if (lines.length > maxLines) {
            for (let i = maxLines; i < lines.length; i++) {
                lines[maxLines - 1] += ' ' + lines[i];
            }
        }

        lines = lines.slice(0, maxLines);

        while ((ctx.measureText(lines[lines.length - 1]).width > maxTextWidth || ctx.measureText(lines[lines.length - 1]).actualBoundingBoxAscent + ctx.measureText(lines[lines.length - 1]).actualBoundingBoxDescent > maxTextHeigth)) {
            ctx.font = parseInt(ctx.font) - 1 + 'px serif';
        }

        currentText = lines.join('\n');
    }

    ctx.fillStyle = 'white';
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 100;

    const lines = currentText.split('\n');
    const lineHeight = parseInt(ctx.font) * 1.2; // Adjust line height as needed
    const startY = centerY - (lineHeight * lines.length) / 2;
    lines.forEach((line, index) => {
        ctx.fillText(line, centerX, startY + index * lineHeight);
    });

    console.log(lines)

    return canvas.toDataURL("image/jpeg").replace("data:image/jpeg;base64,", "")
}

async function generate_openvr_pipe_command(text: string) {
    return {
        "key": "EnqueueOverlay",
        "data": {
            "imageData": await draw_text_on_canvas(text),
            "anchorType": "Head",
            "attachToAnchor": true,
            "durationMs": Math.floor(calculateMinWaitTime(text, 50) + 1000),
            "animationHz": -1,
            "opacityPer": 1,
            "widthM": 1,
            "zDistanceM": 1.5,
            "yDistanceM": -0.3,
        }
    }
}

export async function send_notification_text(text: string) {
    if (!(await invoke("is_steamvr_running"))) {
        const img = draw_text_on_canvas(text);
        const time = Math.floor(calculateMinWaitTime(text, 100) + 1000);

        fetch("http://localhost:18554/?time=" + time, {
            method: "POST",
            body: img
        }).catch((e) => {
            console.error("[DESKTOP OVERLAY] Failed to send notification text:", e);
        })

        return;
    }

    if (!ws_connection?.OPEN) {
        ws_connection?.close();
        ws_connection = new WebSocket("ws://localhost:7711");
        if (await invoke("is_steamvr_running")) {
            if (!ws_connection?.OPEN) {
                ws_connection?.close();
                ws_connection = new WebSocket("ws://localhost:7711");

                ws_connection.onopen = async () => {
                    console.log("[OPENVRPIPE] WebSocket connection established.");

                    ws_connection?.send(JSON.stringify(generate_openvr_pipe_command(text)));
                };
                ws_connection?.send(JSON.stringify(await generate_openvr_pipe_command(text)));
            };

            return
        }

        ws_connection?.send(JSON.stringify(await generate_openvr_pipe_command(text)));
    }
}