#!/bin/bash
# ============================================================
#  京东代下单系统 — 一键拉取更新 + 重新构建 + 重启
#  版本：v5.0
#  新增：
#    - 配置区改为自动检测脚本所在目录，新旧系统永不混淆
#    - 支持通过 .env 控制各业务全链路显示/隐藏（见 backend/.env.example）
#
#  使用方式：
#    chmod +x update.sh        （首次执行前赋予可执行权限）
#    ./update.sh               （全量更新：后端 + 全部前端）
#    ./update.sh backend       （仅拉代码 + 重启后端）
#    ./update.sh admin         （仅拉代码 + 重建后台管理）
#    ./update.sh h5            （仅拉代码 + 重建家政前端 frontend-h5）
#    ./update.sh xi            （仅拉代码 + 重建洗衣前端 frontend-xi）
#    ./update.sh cz            （仅拉代码 + 重建充值前端 frontend-cz）
#    ./update.sh sjz           （仅拉代码 + 重建三角洲前端 frontend-sjz）
#    ./update.sh frontend      （拉代码 + 重建全部前端，不重启后端）
#
#  ⚠️  重要说明：
#    本脚本会自动检测自身所在的项目目录，无需手动修改路径。
#    PM2 进程名自动取项目目录名（如 jdjiazheng / yuyuexitong）。
#    这样同一台服务器上的多个项目可以各自独立使用 update.sh，
#    不会互相影响。
# ============================================================

set -e

# ─────────────────────── 配置区 ───────────────────────
# 🔧 自动检测：脚本所在目录即为项目根目录，无需手动修改
# 原理：无论脚本放在哪个项目目录下，都能正确操作自己的目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 🔧 自动检测：PM2 进程名取项目目录名
# 例如：目录名为 jdjiazheng → PM2 进程名为 jdjiazheng
#       目录名为 yuyuexitong → PM2 进程名为 yuyuexitong
PM2_APP_NAME="$(basename "$PROJECT_DIR")"

# 🔧 自动检测：GitHub 仓库名取目录名（假设仓库名与目录名一致）
# 如果你的仓库名与目录名不同，请手动修改此行
GITHUB_USER="qq419701"
GITHUB_REPO="${GITHUB_USER}/$(basename "$PROJECT_DIR")"

# 国内代理列表（按可用性排序，自动轮换）
PROXY_LIST=(
  "https://gh-proxy.com/https://github.com/${GITHUB_REPO}.git"
  "https://github.moeyy.xyz/https://github.com/${GITHUB_REPO}.git"
  "https://mirror.ghproxy.com/https://github.com/${GITHUB_REPO}.git"
  "https://ghproxy.net/https://github.com/${GITHUB_REPO}.git"
  "https://github.com/${GITHUB_REPO}.git"
)
# ──────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()      { echo -e "${GREEN}[✓]${NC}    $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
log_section() {
  echo -e "\n${CYAN}══════════════════════════════════════${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}══════════════════════════════════════${NC}"
}

START_TIME=$(date +%s)

# ─────────────────── 网络诊断 ───────────────────
check_network() {
  log_info "检测网络连通性..."
  if ! nslookup github.com > /dev/null 2>&1; then
    log_warn "DNS 解析失败，尝试修复..."
    echo "nameserver 8.8.8.8" >> /etc/resolv.conf
    echo "nameserver 114.114.114.114" >> /etc/resolv.conf
  fi
  if curl -s --connect-timeout 5 -o /dev/null https://github.com 2>/dev/null; then
    log_ok "GitHub 直连可用"
    return 0;
  else
    log_warn "GitHub 直连不可用（国内服务器常见），将使用代理"
    return 1;
  fi
}

# ─────────────────── 智能拉取代码（多代理轮换） ───────────────────
pull_code() {
  log_section "📥 拉取最新代码（多代理自动轮换）"
  log_info "项目目录：$PROJECT_DIR"
  log_info "PM2进程名：$PM2_APP_NAME"
  log_info "GitHub仓库：$GITHUB_REPO"
  cd "$PROJECT_DIR"

  git config --global http.lowSpeedLimit 0
  git config --global http.lowSpeedTime 60
  git config --global http.timeout 120
  git config --global core.compression 0

  PULL_SUCCESS=false

  for PROXY_URL in "${PROXY_LIST[@]}"; do
    log_info "尝试源：$PROXY_URL"
    git remote set-url origin "$PROXY_URL"
    if git fetch origin main --progress 2>&1 | tail -3; then
      git reset --hard origin/main
      PULL_SUCCESS=true
      log_ok "✅ 拉取成功！当前版本：$(git log -1 --format='%h %s')"
      break;
    else
      log_warn "❌ 此代理失败，切换下一个..."
      sleep 2;
    fi
  done

  if [ "$PULL_SUCCESS" = false ]; then
    log_warn "所有代理均失败，使用本地已有代码继续..."
    log_info "当前本地版本：$(git log -1 --format='%h %s' 2>/dev/null || echo '未知')"
  fi
}

smart_npm_install() {
  local DIR="$1"
  local LABEL="$2"
  local USE_PROD="$3"
  if [ ! -d "$DIR" ]; then log_warn "$LABEL 目录不存在，跳过"; return; fi
  cd "$DIR"
  if [ ! -f "package.json" ]; then log_warn "$LABEL 未找到 package.json，跳过"; return; fi
  local PKG_HASH_FILE="$DIR/.pkg_hash"
  local CURRENT_HASH
  CURRENT_HASH=$(md5sum package.json | awk '{print $1}')
  if [ -f "$PKG_HASH_FILE" ] && [ "$(cat "$PKG_HASH_FILE")" = "$CURRENT_HASH" ] && [ -d "node_modules" ]; then
    log_ok "$LABEL 依赖无变化，跳过 npm install"
  else
    log_info "$LABEL 安装依赖..."
    if [ "$USE_PROD" = "prod" ]; then npm install --production; else npm install; fi
    echo "$CURRENT_HASH" > "$PKG_HASH_FILE"
    log_ok "$LABEL 依赖安装完成"
  fi
}

update_backend() {
  log_section "⚙️  后端 — 安装依赖 + 重启服务"
  smart_npm_install "$PROJECT_DIR/backend" "后端" "prod"
  log_info "重启 PM2 进程：$PM2_APP_NAME ..."
  if pm2 list | grep -q "$PM2_APP_NAME"; then
    pm2 restart "$PM2_APP_NAME"
    log_ok "PM2 进程已重启"
  else
    log_warn "未找到 PM2 进程，尝试启动..."
    if [ -f "$PROJECT_DIR/ecosystem.config.js" ]; then
      pm2 start "$PROJECT_DIR/ecosystem.config.js"
    else
      pm2 start "$PROJECT_DIR/backend/app.js" --name "$PM2_APP_NAME"
    fi
    pm2 save
    log_ok "PM2 进程已启动"
  fi
}

update_h5() {
  log_section "🏠 家政前端（frontend-h5）— 构建"
  if [ ! -d "$PROJECT_DIR/frontend-h5" ]; then log_warn "目录 frontend-h5 不存在，跳过"; return; fi
  smart_npm_install "$PROJECT_DIR/frontend-h5" "家政前端" "dev"
  cd "$PROJECT_DIR/frontend-h5"
  npm run build
  log_ok "家政前端构建完成 → backend/public/h5/"
}

update_xi() {
  log_section "🧺 洗衣前端（frontend-xi）— 构建"
  if [ ! -d "$PROJECT_DIR/frontend-xi" ]; then log_warn "目录 frontend-xi 不存在，跳过"; return; fi
  smart_npm_install "$PROJECT_DIR/frontend-xi" "洗衣前端" "dev"
  cd "$PROJECT_DIR/frontend-xi"
  npm run build
  log_ok "洗衣前端构建完成 → backend/public/xi/"
}

update_cz() {
  log_section "💎 充值前端（frontend-cz）— 构建"
  if [ ! -d "$PROJECT_DIR/frontend-cz" ]; then log_warn "目录 frontend-cz 不存在，跳过"; return; fi
  smart_npm_install "$PROJECT_DIR/frontend-cz" "充值前端" "dev"
  cd "$PROJECT_DIR/frontend-cz"
  npm run build
  log_ok "充值前端构建完成 → backend/public/cz/"
}

update_sjz() {
  log_section "⚔️  三角洲前端（frontend-sjz）— 构建"
  if [ ! -d "$PROJECT_DIR/frontend-sjz" ]; then log_warn "目录 frontend-sjz 不存在，跳过"; return; fi
  smart_npm_install "$PROJECT_DIR/frontend-sjz" "三角洲前端" "dev"
  cd "$PROJECT_DIR/frontend-sjz"
  npm run build
  log_ok "三角洲前端构建完成 → backend/public/sjz/"
}

update_admin() {
  log_section "🖥️  后台管理（frontend-admin）— 构建"
  if [ ! -d "$PROJECT_DIR/frontend-admin" ]; then log_warn "目录 frontend-admin 不存在，跳过"; return; fi
  smart_npm_install "$PROJECT_DIR/frontend-admin" "后台管理" "dev"
  cd "$PROJECT_DIR/frontend-admin"
  npm run build
  log_ok "后台管理构建完成 → backend/public/admin/"
}

show_status() {
  log_section "📊 服务状态"
  pm2 list
  echo ""
  log_info "后端最新日志（20行）："
  pm2 logs "$PM2_APP_NAME" --nostream --lines 20 2>/dev/null || true
}

main() {
  echo ""
  echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  京东代下单 — 一键更新脚本 v5.0            ║${NC}"
  echo -e "${GREEN}║  $(date '+%Y-%m-%d %H:%M:%S')  国内服务器代理版        ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  📁 项目目录：${CYAN}$PROJECT_DIR${NC}"
  echo -e "  🤖 PM2进程名：${CYAN}$PM2_APP_NAME${NC}"
  echo -e "  📦 GitHub仓库：${CYAN}$GITHUB_REPO${NC}"
  echo ""

  check_network || true

  local CMD="${1:-all}"
  case "$CMD" in
    all)
      pull_code
      update_backend
      update_h5
      update_xi
      update_cz
      update_sjz
      update_admin
      show_status
      ;;
    backend)
      pull_code
      update_backend
      show_status
      ;;
    admin)
      pull_code
      update_admin
      ;;
    h5)
      pull_code
      update_h5
      ;;
    xi)
      pull_code
      update_xi
      ;;
    cz)
      pull_code
      update_cz
      ;;
    sjz)
      pull_code
      update_sjz
      ;;
    frontend)
      pull_code
      update_h5
      update_xi
      update_cz
      update_sjz
      update_admin
      ;;
    *)
      echo "用法: $0 [all|backend|admin|h5|xi|cz|sjz|frontend]"
      echo -e "  ${GREEN}all${NC}       全量更新（默认）：后端 + 全部前端"
      echo -e "  ${GREEN}backend${NC}   仅拉代码 + 重启后端"
      echo -e "  ${GREEN}admin${NC}     仅拉代码 + 重建后台管理"
      echo -e "  ${GREEN}h5${NC}        仅拉代码 + 重建家政前端（frontend-h5）"
      echo -e "  ${GREEN}xi${NC}        仅拉代码 + 重建洗衣前端（frontend-xi）"
      echo -e "  ${GREEN}cz${NC}        仅拉代码 + 重建充值前端（frontend-cz）"
      echo -e "  ${GREEN}sjz${NC}       仅拉代码 + 重建三角洲前端（frontend-sjz）"
      echo -e "  ${GREEN}frontend${NC}  拉代码 + 重建全部前端（不重启后端）"
      exit 1;
      ;;
  esac

  echo ""
  log_ok "全部完成！耗时 $(($(date +%s) - START_TIME)) 秒"
  echo ""
}

main "$@"
