import subprocess, math

def make_one_video(filename, mode, width=540, height=960, fps=30, duration_sec=3):
    total_frames = fps * duration_sec
    print(f"Encoding {filename}.mp4 ({mode})...")

    # Base palette
    bg_r, bg_g, bg_b = 6, 8, 18
    sweater_r, sweater_g, sweater_b = 30, 115, 65
    skin_r, skin_g, skin_b = 255, 226, 210
    hair_r, hair_g, hair_b = 105, 62, 42
    eye_r, eye_g, eye_b = 215, 145, 30

    cmd = [
        'ffmpeg', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
        '-s', f'{width}x{height}', '-pix_fmt', 'rgb24', '-r', str(fps),
        '-i', 'pipe:0', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'ultrafast',
        f'public/{filename}.mp4'
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    for f in range(total_frames):
        t = f / fps

        breath = math.sin(t * math.pi * 2 / 2.5) * 3.5
        sway_x = math.sin(t * math.pi * 2 / 3.0) * 5.0
        sway_y = breath

        cx = width / 2.0 + sway_x
        cy = height * 0.52 + sway_y

        blink = 1.0 if (f % (fps * 3)) > (fps * 2.85) else 0.0
        eye_look_up = 0
        finger_chin = False
        lip_open = 0

        if mode == 'thinking':
            eye_look_up = -10
            finger_chin = True
        elif mode == 'speaking':
            lip_open = math.sin(t * 16) * 6 + 5

        frame = bytearray([bg_r, bg_g, bg_b] * (width * height))

        def draw_circle(x0, y0, radius, r, g, b, alpha=1.0):
            r_int = int(radius)
            min_x = max(0, int(x0 - r_int))
            max_x = min(width - 1, int(x0 + r_int))
            min_y = max(0, int(y0 - r_int))
            max_y = min(height - 1, int(y0 + r_int))
            r2 = radius * radius

            for y in range(min_y, max_y):
                dy = y - y0
                dy2 = dy * dy
                row_off = y * width * 3
                for x in range(min_x, max_x):
                    dx = x - x0
                    if dx * dx + dy2 <= r2:
                        idx = row_off + x * 3
                        if alpha >= 0.99:
                            frame[idx] = r
                            frame[idx+1] = g
                            frame[idx+2] = b
                        else:
                            frame[idx] = int(frame[idx] * (1 - alpha) + r * alpha)
                            frame[idx+1] = int(frame[idx+1] * (1 - alpha) + g * alpha)
                            frame[idx+2] = int(frame[idx+2] * (1 - alpha) + b * alpha)

        def draw_rect(x1, y1, x2, y2, r, g, b):
            x1_c = max(0, min(width - 1, int(x1)))
            x2_c = max(0, min(width - 1, int(x2)))
            y1_c = max(0, min(height - 1, int(y1)))
            y2_c = max(0, min(height - 1, int(y2)))
            for y in range(y1_c, y2_c):
                row_off = y * width * 3
                for x in range(x1_c, x2_c):
                    idx = row_off + x * 3
                    frame[idx] = r
                    frame[idx+1] = g
                    frame[idx+2] = b

        # 1. Platform
        plat_color = (130, 80, 240) if mode == 'thinking' else ((0, 220, 255) if mode == 'waiting' else (240, 100, 220))
        draw_circle(cx, cy + 260, 220, plat_color[0], plat_color[1], plat_color[2], alpha=0.15)

        # 2. Jeans & Belt
        draw_circle(cx, cy + 250, 110, 45, 75, 125)
        draw_rect(cx - 55, cy + 185, cx + 55, cy + 200, 110, 70, 30)

        # Midriff
        draw_circle(cx, cy + 140, 65, skin_r, skin_g, skin_b)

        # 3. Green Turtleneck Top
        draw_circle(cx, cy + 60, 92, sweater_r, sweater_g, sweater_b)
        draw_rect(cx - 75, cy - 20, cx + 75, cy + 80, sweater_r, sweater_g, sweater_b)
        draw_circle(cx, cy - 28, 42, sweater_r - 5, sweater_g - 5, sweater_b - 5)

        # 4. Arms
        draw_circle(cx - 80, cy + 70, 20, sweater_r, sweater_g, sweater_b)
        if finger_chin:
            draw_circle(cx + 45, cy + 30, 18, sweater_r, sweater_g, sweater_b)
            draw_circle(cx + 28, cy - 20, 14, skin_r, skin_g, skin_b)
        else:
            draw_circle(cx + 80, cy + 70, 20, sweater_r, sweater_g, sweater_b)

        # 5. Neck & Face
        draw_rect(cx - 22, cy - 65, cx + 22, cy - 18, skin_r, skin_g, skin_b)
        draw_circle(cx, cy - 88, 68, skin_r, skin_g, skin_b)

        # Blush
        draw_circle(cx - 32, cy - 72, 18, 245, 130, 160, alpha=0.4)
        draw_circle(cx + 32, cy - 72, 18, 245, 130, 160, alpha=0.4)

        # 6. Back Hair
        draw_circle(cx - 58, cy - 82, 60, hair_r, hair_g, hair_b)
        draw_circle(cx + 58, cy - 82, 60, hair_r, hair_g, hair_b)

        # 7. Eyes
        eye_y = cy - 96 + eye_look_up
        for ex in [cx - 25, cx + 25]:
            if blink > 0.5:
                draw_rect(ex - 12, eye_y - 2, ex + 12, eye_y + 2, 40, 30, 30)
            else:
                draw_circle(ex, eye_y, 13, 255, 255, 255)
                draw_circle(ex, eye_y, 8, eye_r, eye_g, eye_b)
                draw_circle(ex, eye_y, 4, 30, 20, 10)
                draw_circle(ex - 3, eye_y - 3, 3, 255, 255, 255)

        # Eyebrows
        draw_rect(cx - 38, eye_y - 18, cx - 12, eye_y - 15, 75, 45, 30)
        draw_rect(cx + 12, eye_y - 18, cx + 38, eye_y - 15, 75, 45, 30)

        # Mouth
        mouth_y = cy - 58
        if lip_open > 2:
            draw_circle(cx, mouth_y + 1, 9, 210, 50, 70)
            draw_circle(cx, mouth_y - 1, 6, 255, 255, 255)
        else:
            draw_rect(cx - 14, mouth_y, cx + 14, mouth_y + 3, 210, 80, 100)

        # 8. Front Hair Bangs & Earrings
        draw_circle(cx, cy - 132, 68, hair_r, hair_g, hair_b)
        draw_circle(cx - 28, cy - 118, 36, hair_r, hair_g, hair_b)
        draw_circle(cx + 28, cy - 118, 36, hair_r, hair_g, hair_b)

        draw_circle(cx - 58, cy - 72, 6, 255, 215, 0)
        draw_circle(cx + 58, cy - 72, 6, 255, 215, 0)

        proc.stdin.write(frame)

    proc.stdin.close()
    proc.wait()
    print(f"Done {filename}.mp4!")

if __name__ == '__main__':
    make_one_video('sanaya_waiting', 'waiting')
    make_one_video('sanaya_thinking', 'thinking')
    make_one_video('sanaya_speaking', 'speaking')
