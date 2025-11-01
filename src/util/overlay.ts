import { invoke } from "@tauri-apps/api/core";
import { calculateMinWaitTime } from "./constants";

function draw_text_on_canvas(text: string, no_space_language: boolean): string {
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
        const words = no_space_language ? currentText : currentText.split(' ');

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

export async function send_notification_text(text: string, no_space_language: boolean) {
    if (await invoke("is_desktop_overlay_running")) {
        const img = draw_text_on_canvas(text, no_space_language);
        const time = Math.floor(calculateMinWaitTime(text, 100) + 1000);

        fetch("http://localhost:18554/?time=" + time, {
            method: "POST",
            body: img
        }).catch((e) => {
            console.error("[DESKTOP OVERLAY] Failed to send notification text:", e);
        })

        return;
    }
}