import subprocess, math

def render_sanaya_videos():
    width, height = 720, 1280
    fps = 30
    duration = 4 # 4 sec smooth loops
    total_frames = fps * duration

    def draw_character(t, state):
        # Create a raw RGB byte buffer
        # Background: dark sleek ambient gradient
        bg_r, bg_g, bg_b = 8, 10, 20
        frame = bytearray([bg_r, bg_g, bg_b] * (width * height))

        # Helper to draw a filled rectangle
        def fill_rect(x1, y1, x2, y2, r, g, b):
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

        # Helper to draw filled circle
        def fill_circle(cx, cy, radius, r, g, b, alpha=1.0):
            r_int = int(radius)
            min_x = max(0, int(cx - r_int))
            max_x = min(width - 1, int(cx + r_int))
            min_y = max(0, int(cy - r_int))
            max_y = min(height - 1, int(cy + r_int))
            r2 = radius * radius
            for y in range(min_y, max_y):
                dy = y - cy
                dy2 = dy * dy
                row_off = y * width * 3
                for x in range(min_x, max_x):
                    dx = x - cx
                    dist2 = dx * dx + dy2
                    if dist2 <= r2:
                        idx = row_off + x * 3
                        if alpha >= 0.99:
                            frame[idx] = r
                            frame[idx+1] = g
                            frame[idx+2] = b
                        else:
                            frame[idx] = int(frame[idx] * (1 - alpha) + r * alpha)
                            frame[idx+1] = int(frame[idx+1] * (1 - alpha) + g * alpha)
                            frame[idx+2] = int(frame[idx+2] * (1 - alpha) + b * alpha)

        # Sway and Breathing calculations
        breath = math.sin(t * math.pi * 2 / 2.5) # 2.5s breath cycle
        sway_x = math.sin(t * math.pi * 2 / 4.0) * 8
        sway_y = breath * 4

        cx = width / 2 + sway_x
        cy = height * 0.52 + sway_y

        # State-based pose tweaks
        eye_look_up = 0
        finger_near_chin = False
        talking_lip_open = 0
        head_tilt = 0

        if state == 'waiting':
            # Gentle smile, normal breathing, periodic blink
            blink = 1.0 if (t % 3.2) > 3.05 else 0.0
        elif state == 'thinking':
            # Looking upward, finger near chin
            eye_look_up = -12
            finger_near_chin = True
            head_tilt = 0.05
            blink = 1.0 if (t % 4.0) > 3.85 else 0.0
        elif state == 'speaking':
            # Natural lip movement, hand movement
            talking_lip_open = math.sin(t * 18) * 8 + 6
            blink = 1.0 if (t % 2.8) > 2.65 else 0.0

        # --- 1. Ambient Hologram Platform Glow ---
        glow_r, glow_g, glow_b = (120, 80, 240) if state == 'thinking' else ((0, 220, 255) if state == 'waiting' else (240, 100, 220))
        fill_circle(cx, cy + 300, 260, glow_r, glow_g, glow_b, alpha=0.18)

        # --- 2. Body / Denim Jeans & Belt ---
        fill_circle(cx, cy + 320, 140, 40, 70, 120) # Jeans hips
        fill_rect(cx - 70, cy + 240, cx + 70, cy + 260, 110, 70, 30) # Brown leather belt

        # Midriff (Skin tone)
        fill_circle(cx, cy + 180, 80, 255, 222, 205)

        # --- 3. Green Turtleneck Crop Top ---
        top_y = cy + 80
        fill_circle(cx, top_y, 115, 34, 110, 65) # Green sweater
        fill_rect(cx - 95, top_y - 60, cx + 95, top_y + 80, 34, 110, 65)

        # Sweater Ribs texture lines
        for line_x in range(int(cx - 80), int(cx + 80), 12):
            fill_rect(line_x, top_y - 50, line_x + 3, top_y + 70, 28, 95, 55)

        # Turtleneck collar
        fill_circle(cx, cy - 35, 50, 30, 100, 60)

        # --- 4. Arms & Hands ---
        # Left Arm
        fill_circle(cx - 100, cy + 90, 24, 34, 110, 65)
        fill_circle(cx - 110, cy + 160, 20, 34, 110, 65)

        # Right Arm (Pose-dependent)
        if finger_near_chin:
            # Hand raised near chin/face
            fill_circle(cx + 60, cy + 40, 22, 34, 110, 65) # forearm
            fill_circle(cx + 35, cy - 25, 18, 255, 222, 205) # hand finger on chin
        else:
            # Normal relaxed arm
            fill_circle(cx + 100, cy + 90, 24, 34, 110, 65)
            fill_circle(cx + 110, cy + 160, 20, 34, 110, 65)

        # --- 5. Neck & Face ---
        fill_rect(cx - 28, cy - 80, cx + 28, cy - 20, 252, 215, 198) # Neck
        fill_circle(cx, cy - 110, 85, 255, 228, 212) # Face shape

        # Rosy Blush
        fill_circle(cx - 40, cy - 90, 22, 245, 130, 160, alpha=0.45)
        fill_circle(cx + 40, cy - 90, 22, 245, 130, 160, alpha=0.45)

        # --- 6. Long Brown Hair (Back Layer) ---
        fill_circle(cx - 70, cy - 100, 75, 95, 58, 40)
        fill_circle(cx + 70, cy - 100, 75, 95, 58, 40)
        fill_circle(cx - 85, cy - 40, 65, 88, 52, 36)
        fill_circle(cx + 85, cy - 40, 65, 88, 52, 36)

        # --- 7. Eyes (Golden Amber) ---
        eye_y = cy - 120 + eye_look_up
        for ex in [cx - 32, cx + 32]:
            if blink > 0.5:
                # Closed blinking eye arc
                fill_rect(ex - 16, eye_y - 2, ex + 16, eye_y + 3, 40, 30, 30)
            else:
                # Eye white
                fill_circle(ex, eye_y, 16, 255, 255, 255)
                # Iris (Amber Gold)
                fill_circle(ex, eye_y, 11, 215, 140, 30)
                # Pupil
                fill_circle(ex, eye_y, 6, 30, 20, 10)
                # Catchlight
                fill_circle(ex - 4, eye_y - 4, 4, 255, 255, 255)

        # Eyebrows
        fill_rect(cx - 48, eye_y - 22, cx - 16, eye_y - 18, 70, 42, 28)
        fill_rect(cx + 16, eye_y - 22, cx + 48, eye_y - 18, 70, 42, 28)

        # Nose
        fill_circle(cx, cy - 95, 3, 210, 150, 130)

        # --- 8. Mouth & Lip Movement ---
        mouth_y = cy - 75
        if talking_lip_open > 2:
            fill_circle(cx, mouth_y + 2, 12, 210, 50, 70) # Open mouth
            fill_circle(cx, mouth_y - 1, 8, 255, 255, 255) # Teeth
        else:
            # Cute smile arc
            fill_rect(cx - 18, mouth_y, cx + 18, mouth_y + 3, 210, 80, 100)

        # --- 9. Front Bangs Hair ---
        fill_circle(cx, cy - 170, 85, 95, 58, 40) # Top hair dome
        fill_circle(cx - 35, cy - 150, 45, 95, 58, 40) # Bangs
        fill_circle(cx + 35, cy - 150, 45, 95, 58, 40)

        # Star Earrings
        fill_circle(cx - 72, cy - 90, 8, 255, 215, 0)
        fill_circle(cx + 72, cy - 90, 8, 255, 215, 0)

        return bytes(frame)

    # Encode each state to mp4
    states = [
        ('sanaya_waiting', 'waiting'),
        ('sanaya_thinking', 'thinking'),
        ('sanaya_speaking', 'speaking'),
    ]

    for filename, state_name in states:
        output_path = f'public/{filename}.mp4'
        print(f'Generating {output_path}...')

        cmd = [
            'ffmpeg', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
            '-s', f'{width}x{height}', '-pix_fmt', 'rgb24', '-r', str(fps),
            '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast',
            output_path
        ]

        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

        for f in range(total_frames):
            t = f / fps
            frame_data = draw_character(t, state_name)
            proc.stdin.write(frame_data)

        proc.stdin.close()
        proc.wait()
        print(f'Successfully generated {output_path}')

if __name__ == '__main__':
    render_sanaya_videos()
