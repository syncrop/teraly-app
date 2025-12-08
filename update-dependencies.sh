#!/bin/bash
# Script de actualización segura de dependencias para Teraly App
#
# IMPORTANTE: Si este script no es ejecutable, ejecuta primero:
#   chmod +x update-dependencies.sh
#
# Uso: ./update-dependencies.sh [opcion]
# Opciones:
#   conservative - Actualización conservadora (solo @types/node)
#   full - Actualización completa (incluye Vite 7)
#   check - Solo verifica actualizaciones disponibles (default)
#
# Ejemplos:
#   ./update-dependencies.sh                # Muestra estado actual
#   ./update-dependencies.sh check          # Igual que anterior
#   ./update-dependencies.sh conservative   # Actualización segura
#   ./update-dependencies.sh full           # Actualización completa

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar que npm está instalado
if ! command_exists npm; then
    print_color "$RED" "❌ Error: npm no está instalado"
    exit 1
fi

# Función para crear backup
create_backup() {
    print_color "$BLUE" "💾 Creando backup de package.json..."
    cp package.json package.json.backup
    if [ -f package-lock.json ]; then
        cp package-lock.json package-lock.json.backup
    fi
    print_color "$GREEN" "✅ Backup creado"
}

# Función para restaurar backup
restore_backup() {
    print_color "$YELLOW" "↩️  Restaurando backup..."
    if [ -f package.json.backup ]; then
        mv package.json.backup package.json
    fi
    if [ -f package-lock.json.backup ]; then
        mv package-lock.json.backup package-lock.json
    fi
    print_color "$GREEN" "✅ Backup restaurado"
}

# Función para limpiar backups
cleanup_backup() {
    if [ -f package.json.backup ]; then
        rm package.json.backup
    fi
    if [ -f package-lock.json.backup ]; then
        rm package-lock.json.backup
    fi
}

# Función para verificar el build
test_build() {
    print_color "$BLUE" "🔨 Probando build del proyecto..."
    if npm run build; then
        print_color "$GREEN" "✅ Build exitoso"
        return 0
    else
        print_color "$RED" "❌ Build falló"
        return 1
    fi
}

# Función para verificar actualizaciones
check_updates() {
    print_color "$BLUE" "🔍 Verificando paquetes desactualizados..."
    npm outdated || true
    
    print_color "$BLUE" "\n🔒 Ejecutando auditoría de seguridad..."
    npm audit
}

# Función para actualización conservadora
conservative_update() {
    print_color "$YELLOW" "\n📦 Iniciando actualización conservadora..."
    print_color "$BLUE" "Solo se actualizará @types/node"
    
    create_backup
    
    print_color "$BLUE" "📦 Actualizando @types/node..."
    if npm install --save-dev @types/node@^24.10.1; then
        print_color "$GREEN" "✅ @types/node actualizado"
    else
        print_color "$RED" "❌ Error al actualizar @types/node"
        restore_backup
        exit 1
    fi
    
    if test_build; then
        cleanup_backup
        print_color "$GREEN" "\n✅ Actualización conservadora completada exitosamente!"
        print_color "$YELLOW" "\nPara hacer commit de los cambios:"
        print_color "$BLUE" "  git add package.json package-lock.json"
        print_color "$BLUE" "  git commit -m 'chore: update @types/node to v24.10.1'"
    else
        print_color "$RED" "\n❌ El build falló después de actualizar"
        restore_backup
        npm install
        exit 1
    fi
}

# Función para actualización completa
full_update() {
    print_color "$YELLOW" "\n📦 Iniciando actualización completa..."
    print_color "$RED" "⚠️  ADVERTENCIA: Esto incluye actualizaciones mayores"
    
    read -p "¿Continuar? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_color "$YELLOW" "Actualización cancelada"
        exit 0
    fi
    
    create_backup
    
    print_color "$BLUE" "📦 Actualizando @types/node..."
    npm install --save-dev @types/node@^24.10.1
    
    print_color "$BLUE" "📦 Actualizando Vite..."
    npm install --save-dev vite@^7.2.7
    
    print_color "$BLUE" "🧹 Limpiando caché..."
    if [ -d .angular/cache ]; then
        rm -rf .angular/cache
    fi
    
    print_color "$BLUE" "📦 Reinstalando dependencias..."
    npm install
    
    if test_build; then
        cleanup_backup
        print_color "$GREEN" "\n✅ Actualización completa exitosa!"
        print_color "$YELLOW" "\nPara hacer commit de los cambios:"
        print_color "$BLUE" "  git add package.json package-lock.json"
        print_color "$BLUE" "  git commit -m 'chore: update dependencies to latest versions'"
    else
        print_color "$RED" "\n❌ El build falló después de actualizar"
        restore_backup
        npm install
        exit 1
    fi
}

# Main
print_color "$GREEN" "==================================="
print_color "$GREEN" "  Teraly App - Update Script"
print_color "$GREEN" "==================================="

OPTION=${1:-check}

case $OPTION in
    check)
        check_updates
        print_color "$YELLOW" "\n💡 Para actualizar las dependencias:"
        print_color "$BLUE" "  ./update-dependencies.sh conservative  # Actualización segura"
        print_color "$BLUE" "  ./update-dependencies.sh full          # Actualización completa"
        ;;
    conservative)
        conservative_update
        ;;
    full)
        full_update
        ;;
    *)
        print_color "$RED" "Opción no válida: $OPTION"
        print_color "$YELLOW" "Uso: ./update-dependencies.sh [check|conservative|full]"
        exit 1
        ;;
esac
