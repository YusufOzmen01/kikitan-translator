import { calculateMinWaitTime } from "./constants";

let ws_connection: WebSocket | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const uint8 = new Uint8Array(buffer);
    const base64Table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let result = '';
    let i;

    for (i = 0; i < uint8.length - 2; i += 3) {
        result += base64Table[uint8[i] >> 2];
        result += base64Table[((uint8[i] & 3) << 4) | (uint8[i + 1] >> 4)];
        result += base64Table[((uint8[i + 1] & 15) << 2) | (uint8[i + 2] >> 6)];
        result += base64Table[uint8[i + 2] & 63];
    }

    if (i < uint8.length) {
        result += base64Table[uint8[i] >> 2];
        if (i === uint8.length - 1) {
            result += base64Table[(uint8[i] & 3) << 4];
            result += '==';
        } else {
            result += base64Table[((uint8[i] & 3) << 4) | (uint8[i + 1] >> 4)];
            result += base64Table[(uint8[i + 1] & 15) << 2];
            result += '=';
        }
    }

    return result;
}


async function draw_text_on_canvas(text: string) {
    const canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    const img = new Image();

    ctx = ctx!;

    const arraybuffer = (await (await fetch("https://i.imgur.com/FSdVdOc.jpeg")).arrayBuffer());

    img.src = `data:image/jpeg;base64,${arrayBufferToBase64(arraybuffer)}`;
    img.crossOrigin = "anonymous";

    return new Promise((resolve) => {
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);
            ctx.font = '500px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const maxTextWidth = 4100;
            const maxTextHeigth = 1000;
            const maxLines = 4;
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
            const centerX = 3200;
            const centerY = 650;

            const lines = currentText.split('\n');
            const lineHeight = parseInt(ctx.font) * 1.2; // Adjust line height as needed
            const startY = centerY - (lineHeight * lines.length) / 2;
            lines.forEach((line, index) => {
                ctx.fillText(line, centerX, startY + index * lineHeight);
            });

            console.log(lines)

            resolve(canvas.toDataURL("image/jpeg").replace("data:image/jpeg;base64,", ""));
        };
    })
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
    // TODO: Check if SteamVR is running
    // If so, check if OpenVRPipe is running
    // If not, start OpenVRPipe

    // If steamVR is not running, then send the notification to the desktop overlay
    if (!ws_connection?.OPEN) {
        ws_connection?.close();
        ws_connection = new WebSocket("ws://localhost:7711");

        ws_connection.onopen = async () => {
            console.log("[OPENVRPIPE] WebSocket connection established.");

            ws_connection?.send(JSON.stringify(await generate_openvr_pipe_command(text)));
        };

        return
    }

    ws_connection?.send(JSON.stringify(await generate_openvr_pipe_command(text)));
}