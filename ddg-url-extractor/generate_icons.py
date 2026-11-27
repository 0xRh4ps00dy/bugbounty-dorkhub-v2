#!/usr/bin/env python3
"""
Generador de iconos para las extensiones de Chrome
Crea iconos en formato PNG de 16x16, 48x48 y 128x128
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("⚠️  Pillow no está instalado. Instalando...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageDraw, ImageFont
    print("✅ Pillow instalado correctamente")

import os

def create_ddg_extractor_icon(size, output_path):
    """Crea icono para DuckDuckGo URL Extractor"""
    # Crear imagen con fondo degradado naranja
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # Fondo degradado diagonal (más dinámico)
    color_start = (222, 88, 51)  # #de5833
    color_end = (212, 59, 28)    # #d43b1c
    
    for y in range(size):
        for x in range(size):
            # Gradiente diagonal
            ratio = (x + y) / (size * 2)
            r = int(color_start[0] + (color_end[0] - color_start[0]) * ratio)
            g = int(color_start[1] + (color_end[1] - color_start[1]) * ratio)
            b = int(color_start[2] + (color_end[2] - color_start[2]) * ratio)
            draw.point((x, y), fill=(r, g, b))
    
    # Dibujar icono de documento/lista con URLs
    scale = size / 128
    
    # Documento principal (ligeramente descentrado para mejor balance)
    doc_width = int(70 * scale)
    doc_height = int(90 * scale)
    doc_x = int(25 * scale)
    doc_y = int(15 * scale)
    
    # Sombra del documento
    shadow_offset = int(3 * scale)
    draw.rounded_rectangle(
        [(doc_x + shadow_offset, doc_y + shadow_offset), 
         (doc_x + doc_width + shadow_offset, doc_y + doc_height + shadow_offset)],
        radius=int(6 * scale),
        fill=(0, 0, 0, 30)
    )
    
    # Cuerpo del documento
    draw.rounded_rectangle(
        [(doc_x, doc_y), (doc_x + doc_width, doc_y + doc_height)],
        radius=int(6 * scale),
        fill='white'
    )
    
    # Esquina doblada (efecto papel)
    fold_size = int(15 * scale)
    fold_points = [
        (doc_x + doc_width - fold_size, doc_y),
        (doc_x + doc_width, doc_y + fold_size),
        (doc_x + doc_width, doc_y)
    ]
    draw.polygon(fold_points, fill=(240, 240, 240))
    
    # Línea de la doblez
    draw.line([
        (doc_x + doc_width - fold_size, doc_y),
        (doc_x + doc_width - fold_size, doc_y + fold_size),
        (doc_x + doc_width, doc_y + fold_size)
    ], fill=(220, 220, 220), width=int(1 * scale))
    
    # Icono de link/URL en la esquina superior izquierda
    link_size = int(12 * scale)
    link_x = doc_x + int(8 * scale)
    link_y = doc_y + int(8 * scale)
    
    # Círculo del icono de link
    draw.ellipse(
        [(link_x, link_y), (link_x + link_size, link_y + link_size)],
        fill=(222, 88, 51)
    )
    
    # Cadena/Link dentro del círculo
    link_inner = int(4 * scale)
    draw.arc(
        [(link_x + link_inner, link_y + link_inner), 
         (link_x + link_size - link_inner, link_y + link_size - link_inner)],
        start=45, end=225,
        fill='white',
        width=int(2 * scale)
    )
    
    # Líneas que representan URLs (más variadas)
    line_color = (222, 88, 51)
    line_positions = [
        (35, 50, 48),   # y, width_percent
        (42, 55, 45),
        (50, 45, 40),
        (65, 52, 46),
        (73, 48, 42),
        (88, 50, 44)
    ]
    
    for i, (y_percent, width_percent, x_offset_percent) in enumerate(line_positions):
        y_pos = int(y_percent * scale)
        x_start = doc_x + int(10 * scale)
        line_width = int((width_percent * scale))
        line_height = int(3 * scale)
        
        # Alternar opacidad para dar sensación de profundidad
        alpha = 255 if i % 2 == 0 else 200
        
        draw.rounded_rectangle(
            [(x_start, y_pos), (x_start + line_width, y_pos + line_height)],
            radius=int(1.5 * scale),
            fill=line_color
        )
    
    # Punto de énfasis (como un cursor o highlight)
    cursor_x = doc_x + int(8 * scale)
    cursor_y = int(42 * scale)
    cursor_height = int(4 * scale)
    draw.rectangle(
        [(cursor_x, cursor_y), (cursor_x + int(2 * scale), cursor_y + cursor_height)],
        fill=(255, 100, 50)
    )
    
    img.save(output_path, 'PNG')
    print(f"✓ Creado: {output_path} ({size}x{size})")

def create_dorkhub_helper_icon(size, output_path):
    """Crea icono para BugBounty DorkHub Helper"""
    # Crear imagen con fondo degradado verde
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # Fondo degradado verde
    color_start = (76, 175, 80)   # #4caf50
    color_end = (69, 160, 73)     # #45a049
    
    for i in range(size):
        ratio = i / size
        r = int(color_start[0] + (color_end[0] - color_start[0]) * ratio)
        g = int(color_start[1] + (color_end[1] - color_start[1]) * ratio)
        b = int(color_start[2] + (color_end[2] - color_start[2]) * ratio)
        draw.line([(0, i), (size, i)], fill=(r, g, b))
    
    # Dibujar múltiples ventanas/pestañas
    scale = size / 128
    
    # Ventana 1 (atrás)
    draw.rounded_rectangle(
        [(int(25 * scale), int(50 * scale)), 
         (int(75 * scale), int(90 * scale))],
        radius=int(6 * scale),
        fill=(255, 255, 255, 200),
        outline='white',
        width=int(2 * scale)
    )
    
    # Ventana 2 (medio)
    draw.rounded_rectangle(
        [(int(35 * scale), int(40 * scale)), 
         (int(85 * scale), int(80 * scale))],
        radius=int(6 * scale),
        fill=(255, 255, 255, 230),
        outline='white',
        width=int(2 * scale)
    )
    
    # Ventana 3 (frente) - más visible
    draw.rounded_rectangle(
        [(int(45 * scale), int(30 * scale)), 
         (int(95 * scale), int(70 * scale))],
        radius=int(6 * scale),
        fill='white',
        outline='white',
        width=int(3 * scale)
    )
    
    # Barra de la ventana frontal
    draw.rounded_rectangle(
        [(int(45 * scale), int(30 * scale)), 
         (int(95 * scale), int(42 * scale))],
        radius=int(6 * scale),
        fill=(76, 175, 80)
    )
    
    # Puntos de la barra (botones)
    dot_y = int(36 * scale)
    for i, x in enumerate([52, 60, 68]):
        draw.ellipse(
            [(int(x * scale), dot_y - int(2 * scale)), 
             (int(x * scale) + int(4 * scale), dot_y + int(2 * scale))],
            fill='white'
        )
    
    img.save(output_path, 'PNG')
    print(f"✓ Creado: {output_path} ({size}x{size})")

def main():
    print("\n🎨 Generador de Iconos para Extensiones de Chrome\n")
    
    # Rutas de las extensiones
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    ddg_dir = script_dir  # Este script está en ddg-url-extractor
    dorkhub_dir = os.path.join(project_root, 'chrome-extension')
    
    # Tamaños de iconos requeridos
    sizes = [16, 48, 128]
    
    # Crear iconos para DuckDuckGo URL Extractor
    print("📋 DuckDuckGo URL Extractor:")
    for size in sizes:
        output_path = os.path.join(ddg_dir, f'icon{size}.png')
        create_ddg_extractor_icon(size, output_path)
    
    print("\n🎯 BugBounty DorkHub Helper:")
    for size in sizes:
        output_path = os.path.join(dorkhub_dir, f'icon{size}.png')
        create_dorkhub_helper_icon(size, output_path)
    
    print("\n✅ ¡Todos los iconos creados correctamente!\n")
    print("📝 Próximos pasos:")
    print("   1. Los iconos ya están en las carpetas correctas")
    print("   2. Los manifest.json se actualizarán automáticamente")
    print("   3. Recarga las extensiones en chrome://extensions/\n")

if __name__ == '__main__':
    main()
