import math
from PIL import Image, ImageDraw, ImageFilter
import os

def create_vani_icon(size=512):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Base Squircle / Rounded Container
    pad = int(size * 0.05)
    r = int(size * 0.22)
    box = [pad, pad, size - pad, size - pad]

    # Create gradient background
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)
    
    # Rounded mask
    bg_draw.rounded_rectangle(box, radius=r, fill=(20, 16, 36, 255))
    
    # Draw radial/linear gradient across mask
    for y in range(pad, size - pad):
        factor = (y - pad) / (size - 2 * pad)
        # Deep Indigo/Violet (#14102c to #0b0f1d)
        r_c = int(24 * (1 - factor) + 11 * factor)
        g_c = int(18 * (1 - factor) + 15 * factor)
        b_c = int(48 * (1 - factor) + 32 * factor)
        bg_draw.line([(pad, y), (size - pad, y)], fill=(r_c, g_c, b_c, 255))

    # Apply rounded mask
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(box, radius=r, fill=255)
    
    final_bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    final_bg.paste(bg, (0, 0), mask)

    # Add Subtle Border Glow
    border_draw = ImageDraw.Draw(final_bg)
    border_draw.rounded_rectangle(box, radius=r, outline=(139, 92, 246, 120), width=int(size * 0.015))

    # 2. Glowing Soundwave Lotus / Sacred Acoustic Core
    center_x = size / 2
    center_y = size / 2

    # Outer ambient glow circle
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_radius = int(size * 0.36)
    glow_draw.ellipse(
        [center_x - glow_radius, center_y - glow_radius, center_x + glow_radius, center_y + glow_radius],
        fill=(99, 102, 241, 45)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(int(size * 0.08)))
    final_bg = Image.alpha_composite(final_bg, glow)

    # Draw Modern Geometric Soundwave Petals
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)

    # Central Audio Pillars (Soundwaves in Sacred proportions)
    num_bars = 7
    bar_width = int(size * 0.042)
    bar_spacing = int(size * 0.024)
    total_w = num_bars * bar_width + (num_bars - 1) * bar_spacing
    start_x = center_x - (total_w / 2)

    # Heights shaping a temple/lotus peak: [0.3, 0.5, 0.75, 1.0, 0.75, 0.5, 0.3]
    height_factors = [0.32, 0.52, 0.76, 1.0, 0.76, 0.52, 0.32]
    max_h = size * 0.44

    for i in range(num_bars):
        bx = start_x + i * (bar_width + bar_spacing)
        bh = max_h * height_factors[i]
        by1 = center_y - (bh / 2)
        by2 = center_y + (bh / 2)

        # Bar Gradient color interpolation (Gold-Amber in center, Indigo-Cyan on edges)
        dist_from_center = abs(i - 3) / 3.0
        if dist_from_center == 0:
            fill_color = (251, 191, 36, 255)  # Gold #fbbf24
        elif dist_from_center <= 0.35:
            fill_color = (245, 158, 11, 240)  # Amber #f59e0b
        elif dist_from_center <= 0.7:
            fill_color = (129, 140, 248, 230) # Indigo #818cf8
        else:
            fill_color = (56, 189, 248, 210)  # Sky Cyan #38bdf8

        ov_draw.rounded_rectangle([bx, by1, bx + bar_width, by2], radius=int(bar_width / 2), fill=fill_color)

    # Golden Lotus Arc below soundwave
    arc_box = [center_x - size * 0.28, center_y + size * 0.05, center_x + size * 0.28, center_y + size * 0.32]
    ov_draw.arc(arc_box, start=20, end=160, fill=(251, 191, 36, 200), width=int(size * 0.02))

    # Top Bindu / Radiant Sparkle Dot
    dot_r = int(size * 0.024)
    dot_y = center_y - (max_h / 2) - int(size * 0.055)
    ov_draw.ellipse([center_x - dot_r, dot_y - dot_r, center_x + dot_r, dot_y + dot_r], fill=(254, 240, 138, 255))

    final_image = Image.alpha_composite(final_bg, overlay)
    return final_image

def main():
    icon512 = create_vani_icon(512)
    
    # Save standard PNGs
    os.makedirs("resources", exist_ok=True)
    os.makedirs("build", exist_ok=True)
    os.makedirs("src/renderer/src/assets", exist_ok=True)

    icon512.save("resources/icon.png", format="PNG")
    icon512.save("build/icon.png", format="PNG")
    icon512.save("src/renderer/src/assets/logo.png", format="PNG")

    # Generate multi-size Windows .ico
    sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    icon512.save("build/icon.ico", format="ICO", sizes=sizes)
    print("Successfully generated Vani Studio icons: resources/icon.png, build/icon.png, build/icon.ico, src/renderer/src/assets/logo.png")


if __name__ == "__main__":
    main()
