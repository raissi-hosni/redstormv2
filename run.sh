#!/bin/bash
# run.sh - Script de démarrage RedStorm

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction d'affichage avec couleurs
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${CYAN}[REDSTORM]${NC} $1"
}

# Banner RedStorm
show_banner() {
    echo -e "${RED}"
    cat << "EOF"
    ____           __ _____ __                      
   / __ \___  ____/ // ___// /_____  _________ ___ 
  / /_/ / _ \/ __  / \__ \/ __/ __ \/ ___/ __ `__ \
 / _, _/  __/ /_/ / ___/ / /_/ /_/ / /  / / / / / /
/_/ |_|\___/\__,_/ /____/\__/\____/_/  /_/ /_/ /_/ 
                                                   
EOF
    echo -e "${NC}"
    echo -e "${CYAN}Plateforme de Simulation d'Attaques Cybernétiques${NC}"
    echo -e "${CYAN}Version 1.0 - Alimentée par l'Intelligence Artificielle${NC}"
    echo -e "${CYAN}Développée pour l'éducation et la formation éthique${NC}"
    echo ""
}

# Vérification de l'environnement
check_environment() {
    print_header "Vérification de l'environnement système..."
    
    # Vérification Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé"
        print_status "Installation requise : https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Vérification Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose n'est pas installé"
        print_status "Installation requise : https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Vérification des versions
    docker_version=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    compose_version=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    
    print_success "Docker $docker_version détecté"
    print_success "Docker Compose $compose_version détecté"
    
    # Vérification des ports
    check_ports
    
    # Vérification du fichier .env
    if [ ! -f .env ]; then
        print_warning "Fichier .env manquant, création avec valeurs par défaut..."
        create_env_file
    else
        print_success "Fichier .env trouvé"
    fi
    
    print_success "Environnement validé"
}

# Vérification des ports
check_ports() {
    local ports=(3000 8000 8080 6379 9090 3001)
    local used_ports=()
    
    for port in "${ports[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            used_ports+=($port)
        fi
    done
    
    if [ ${#used_ports[@]} -gt 0 ]; then
        print_warning "Ports déjà utilisés : ${used_ports[*]}"
        read -p "Continuer quand même? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Arrêt de l'installation"
            exit 1
        fi
    fi
}

# Création du fichier .env
create_env_file() {
    cat > .env << EOF
# Configuration RedStorm
NODE_ENV=development
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=$(openssl rand -base64 32)

# APIs IA (à configurer avec vos vraies clés)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Sécurité
JWT_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Monitoring et logs
ENABLE_METRICS=true
LOG_LEVEL=info

# Configuration des outils
NMAP_TIMING=T4
SCAN_TIMEOUT=300
MAX_CONCURRENT_SCANS=5

# Limites éthiques
ENABLE_ETHICAL_CHECKS=true
REQUIRE_TARGET_AUTHORIZATION=true
BLOCK_PRIVATE_IPS=false
EOF
    print_success "Fichier .env créé avec configuration par défaut"
    print_warning "N'oubliez pas de configurer vos clés API dans le fichier .env"
}

# Construction des images Docker
build_images() {
    print_header "Construction des images Docker..."
    
    # Vérification de l'espace disque
    available_space=$(df . | tail -1 | awk '{print $4}')
    if [ "$available_space" -lt 5000000 ]; then  # 5GB en KB
        print_warning "Espace disque faible (< 5GB disponible)"
    fi
    
    # Construction en parallèle pour optimiser le temps
    print_status "Construction des images (cela peut prendre plusieurs minutes)..."
    
    if docker-compose build --parallel; then
        print_success "Images construites avec succès"
    else
        print_error "Erreur lors de la construction des images"
        exit 1
    fi
}

# Démarrage des services
start_services() {
    print_header "Démarrage des services RedStorm..."
    
    # Création des répertoires nécessaires
    mkdir -p logs data/cache data/reports
    
    # Démarrage des services
    print_status "Lancement des conteneurs..."
    if docker-compose up -d; then
        print_success "Services démarrés"
    else
        print_error "Erreur lors du démarrage des services"
        exit 1
    fi
    
    print_status "Initialisation des services en cours..."
    show_startup_progress
    
    # Vérification de l'état des services
    check_services_health
}

# Affichage de la progression du démarrage
show_startup_progress() {
    local max_wait=60
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        local ready_services=0
        local total_services=6
        
        # Vérification Redis
        if docker exec redstorm-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
            ((ready_services++))
        fi
        
        # Vérification Backend
        if curl -f http://localhost:8000/health &>/dev/null; then
            ((ready_services++))
        fi
        
        # Vérification Frontend
        if curl -f http://localhost:3000 &>/dev/null; then
            ((ready_services++))
        fi
        
        # Vérification Tools
        if curl -f http://localhost:8080/health &>/dev/null; then
            ((ready_services++))
        fi
        
        # Vérification Prometheus
        if curl -f http://localhost:9090/-/healthy &>/dev/null; then
            ((ready_services++))
        fi
        
        # Vérification Grafana
        if curl -f http://localhost:3001/api/health &>/dev/null; then
            ((ready_services++))
        fi
        
        # Calcul du pourcentage
        local percentage=$((ready_services * 100 / total_services))
        
        # Affichage de la barre de progression
        printf "\r${BLUE}[INFO]${NC} Progression: ["
        for ((i=0; i<50; i++)); do
            if [ $i -lt $((percentage / 2)) ]; then
                printf "="
            else
                printf " "
            fi
        done
        printf "] %d%% (%d/%d services)" $percentage $ready_services $total_services
        
        if [ $ready_services -eq $total_services ]; then
            echo ""
            print_success "Tous les services sont opérationnels"
            return 0
        fi
        
        sleep 2
        ((wait_time += 2))
    done
    
    echo ""
    print_warning "Certains services mettent plus de temps à démarrer"
}

# Vérification de la santé des services
check_services_health() {
    print_header "Vérification de l'état des services..."
    
    local services_status=()
    
    # Test Redis
    if docker exec redstorm-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        services_status+=("✅ Redis: Opérationnel")
    else
        services_status+=("❌ Redis: Non accessible")
    fi
    
    # Test Backend API
    if curl -f http://localhost:8000/health &>/dev/null; then
        services_status+=("✅ Backend API: Opérationnel")
    else
        services_status+=("❌ Backend API: Non accessible")
    fi
    
    # Test Frontend
    if curl -f http://localhost:3000 &>/dev/null; then
        services_status+=("✅ Frontend: Opérationnel")
    else
        services_status+=("❌ Frontend: Non accessible")
    fi
    
    # Test Tools
    if curl -f http://localhost:8080/health &>/dev/null; then
        services_status+=("✅ Outils Go: Opérationnels")
    else
        services_status+=("❌ Outils Go: Non accessibles")
    fi
    
    # Test Prometheus
    if curl -f http://localhost:9090/-/healthy &>/dev/null; then
        services_status+=("✅ Prometheus: Opérationnel")
    else
        services_status+=("⚠️  Prometheus: Non accessible (monitoring désactivé)")
    fi
    
    # Test Grafana
    if curl -f http://localhost:3001/api/health &>/dev/null; then
        services_status+=("✅ Grafana: Opérationnel")
    else
        services_status+=("⚠️  Grafana: Non accessible (dashboards désactivés)")
    fi
    
    # Affichage du statut
    echo ""
    for status in "${services_status[@]}"; do
        echo "   $status"
    done
    echo ""
    
    # Vérification des erreurs critiques
    local critical_errors=0
    for status in "${services_status[@]}"; do
        if [[ $status == *"❌"* ]]; then
            ((critical_errors++))
        fi
    done
    
    if [ $critical_errors -gt 0 ]; then
        print_error "$critical_errors service(s) critique(s) non opérationnel(s)"
        print_status "Consultez les logs avec: docker-compose logs"
        return 1
    fi
    
    return 0
}

# Affichage des informations de connexion
show_connection_info() {
    echo ""
    print_success "🎉 RedStorm est maintenant opérationnel !"
    echo ""
    echo -e "${CYAN}🌐 Accès aux services :${NC}"
    echo "   • Interface utilisateur principale : ${GREEN}http://localhost:3000${NC}"
    echo "   • API Backend et documentation : ${GREEN}http://localhost:8000${NC}"
    echo "   • Documentation API interactive : ${GREEN}http://localhost:8000/docs${NC}"
    echo "   • Outils de sécurité Go : ${GREEN}http://localhost:8080${NC}"
    echo "   • Monitoring Grafana : ${GREEN}http://localhost:3001${NC} (admin/admin)"
    echo "   • Métriques Prometheus : ${GREEN}http://localhost:9090${NC}"
    echo ""
    echo -e "${CYAN}🔧 Commandes utiles :${NC}"
    echo "   • Arrêter RedStorm : ${YELLOW}./stop.sh${NC}"
    echo "   • Redémarrer : ${YELLOW}./restart.sh${NC}"
    echo "   • Logs en temps réel : ${YELLOW}docker-compose logs -f${NC}"
    echo "   • Statut des services : ${YELLOW}docker-compose ps${NC}"
    echo "   • Maintenance : ${YELLOW}./maintenance.sh${NC}"
    echo ""
    echo -e "${CYAN}⚙️  Configuration :${NC}"
    echo "   • Fichier de configuration : ${YELLOW}.env${NC}"
    echo "   • Logs de l'application : ${YELLOW}./logs/${NC}"
    echo "   • Données de cache : ${YELLOW}./data/cache/${NC}"
    echo "   • Rapports générés : ${YELLOW}./data/reports/${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Configuration requise pour utilisation complète :${NC}"
    echo "   • Configurez vos clés API dans le fichier .env :"
    echo "     - OPENAI_API_KEY pour les analyses IA avancées"
    echo "     - ANTHROPIC_API_KEY pour les analyses contextuelles"
    echo "   • Redémarrez après configuration : ${YELLOW}./restart.sh${NC}"
    echo ""
    echo -e "${CYAN}📚 Documentation complète :${NC}"
    echo "   • Rapport technique : ${YELLOW}./docs/rapport-redstorm-fr.md${NC}"
    echo "   • Guide d'utilisation : ${GREEN}http://localhost:3000/docs${NC}"
    echo ""
    echo -e "${GREEN}🛡️  Utilisation éthique uniquement !${NC}"
    echo "   RedStorm est conçu pour l'éducation et la formation."
    echo "   Utilisez uniquement sur vos propres systèmes ou avec autorisation explicite."
    echo ""
}

# Gestion des signaux
cleanup() {
    echo ""
    print_status "Arrêt de RedStorm en cours..."
    docker-compose down
    print_success "RedStorm arrêté"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Fonction d'aide
show_help() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  start, run          Démarrer RedStorm (défaut)"
    echo "  stop               Arrêter RedStorm"
    echo "  restart            Redémarrer RedStorm"
    echo "  status             Afficher le statut des services"
    echo "  logs               Afficher les logs"
    echo "  update             Mettre à jour RedStorm"
    echo "  clean              Nettoyer les données et images"
    echo "  help, -h, --help   Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0                 # Démarrer RedStorm"
    echo "  $0 status          # Vérifier l'état des services"
    echo "  $0 logs backend    # Afficher les logs du backend"
    echo ""
}

# Fonction principale
main() {
    local command=${1:-start}
    
    case $command in
        start|run)
            show_banner
            check_environment
            build_images
            start_services
            show_connection_info
            
            # Maintien du script actif pour les logs
            print_header "RedStorm en cours d'exécution. Ctrl+C pour arrêter."
            print_status "Aff
