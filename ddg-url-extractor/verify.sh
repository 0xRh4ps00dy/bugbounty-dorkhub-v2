#!/bin/bash

# Script de verificación para las extensiones de Chrome
# DuckDuckGo URL Extractor

echo "🔍 Verificando extensión DuckDuckGo URL Extractor..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador
errors=0
warnings=0

# Verificar directorio
if [ -d "ddg-url-extractor" ]; then
    echo -e "${GREEN}✓${NC} Directorio ddg-url-extractor existe"
else
    echo -e "${RED}✗${NC} Directorio ddg-url-extractor NO existe"
    ((errors++))
    exit 1
fi

cd ddg-url-extractor

echo ""
echo "📄 Verificando archivos requeridos..."

# Archivos requeridos
required_files=(
    "manifest.json"
    "content.js"
    "popup.html"
    "popup.css"
    "popup.js"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file")
        if [ $size -gt 0 ]; then
            echo -e "${GREEN}✓${NC} $file (${size} bytes)"
        else
            echo -e "${RED}✗${NC} $file (vacío)"
            ((errors++))
        fi
    else
        echo -e "${RED}✗${NC} $file (no existe)"
        ((errors++))
    fi
done

# Archivos opcionales
optional_files=(
    "README.md"
    "INSTALL.md"
    "generate-icons.html"
)

echo ""
echo "📄 Verificando archivos opcionales..."
for file in "${optional_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${YELLOW}⚠${NC} $file (opcional, no existe)"
        ((warnings++))
    fi
done

# Verificar sintaxis JSON del manifest
echo ""
echo "🔍 Verificando sintaxis de manifest.json..."
if command -v python3 &> /dev/null; then
    if python3 -c "import json; json.load(open('manifest.json'))" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} manifest.json es JSON válido"
    else
        echo -e "${RED}✗${NC} manifest.json tiene errores de sintaxis"
        ((errors++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Python3 no disponible, no se puede verificar JSON"
fi

# Verificar permisos en manifest
echo ""
echo "🔍 Verificando permisos en manifest.json..."
if grep -q '"activeTab"' manifest.json; then
    echo -e "${GREEN}✓${NC} Permiso 'activeTab' encontrado"
else
    echo -e "${RED}✗${NC} Permiso 'activeTab' no encontrado"
    ((errors++))
fi

if grep -q '"clipboardWrite"' manifest.json; then
    echo -e "${GREEN}✓${NC} Permiso 'clipboardWrite' encontrado"
else
    echo -e "${RED}✗${NC} Permiso 'clipboardWrite' no encontrado"
    ((errors++))
fi

# Verificar matches en content_scripts
echo ""
echo "🔍 Verificando content_scripts..."
if grep -q '"matches".*google.com' manifest.json; then
    echo -e "${GREEN}✓${NC} Match para Google configurado"
else
    echo -e "${RED}✗${NC} Match para Google no encontrado"
    ((errors++))
fi

# Verificar funciones clave en content.js
echo ""
echo "🔍 Verificando funciones en content.js..."
functions=(
    "extractURLsFromGoogle"
    "createExtractButton"
    "showURLsModal"
)

for func in "${functions[@]}"; do
    if grep -q "function $func" content.js || grep -q "const $func" content.js; then
        echo -e "${GREEN}✓${NC} Función '$func' encontrada"
    else
        echo -e "${RED}✗${NC} Función '$func' no encontrada"
        ((errors++))
    fi
done

# Verificar selectores de Google
echo ""
echo "🔍 Verificando selectores de Google..."
if grep -q 'article.*data-testid.*result' content.js; then
    echo -e "${GREEN}✓${NC} Selectores de resultados configurados"
else
    echo -e "${YELLOW}⚠${NC} Selectores de resultados podrían estar desactualizados"
    ((warnings++))
fi

# Resumen
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ La extensión está lista para instalar!${NC}"
    echo ""
    echo "📝 Próximos pasos:"
    echo "   1. Abre Chrome: chrome://extensions/"
    echo "   2. Activa 'Modo de desarrollador'"
    echo "   3. Clic en 'Cargar extensión sin empaquetar'"
    echo "   4. Selecciona la carpeta: ddg-url-extractor/"
else
    echo -e "${RED}❌ Se encontraron $errors error(es)${NC}"
    echo "   Por favor corrige los errores antes de instalar"
fi

if [ $warnings -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $warnings advertencia(s)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Salir con código de error si hay errores
if [ $errors -gt 0 ]; then
    exit 1
else
    exit 0
fi
