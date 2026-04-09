#!/bin/bash
# ============================================================
#  京东代下单系统 — 一键拉取更新 + 重新构建 + 重启
#  版本：v2.1（订单中心+业务设置+SUP三业务 大更新版）
#
#  使用方式：
#    chmod +x update.sh      （首次执行前赋予可执行权限）
#    ./update.sh             （全量更新：后端+三套前端+后台管理）
#    ./update.sh backend     （仅重启后端，适合后端逻辑/接口更新）
#    ./update.sh admin       （仅重建后台管理，适合前端页面更新）
#    ./update.sh h5          （仅重建家政H5）
#    ./update.sh xi          （仅重建洗衣H5）
#    ./update.sh cz          （仅重建充值H5）
#    ./update.sh frontend    （重建全部前端，不重启后端）
#    ./update.sh sup         （仅重启后端，用于SUP/撤单逻辑更新）
#    ./update.sh order       （拉代码+重建admin+重启后端，订单中心大更新专用）
# ============================================================

set -e   # 任意命令失败立即退出

# ─────────────────────── 配置区 ───────────────────────
PROJECT_DIR="$(cd """)" && pwd)"
PM2_APP_NAME="jdjiazheng"
# ──────────────────────────────────────────────────────

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
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

# 记录开始时间
START_TIME=$(date +%s)

# ─────────────────────── 拉取代码 ───────────────────────
pull_code() {
  log_section "📥 拉取最新代码（git pull）"
  cd "$PROJECT_DIR"
  log_info "正在从远端拉取最新代码..."
  git fetch origin main
  git reset --hard origin/main
  log_ok "代码已同步到最新：$(git log -1 --format='%h %s')"
}

# ─────────────────────── 依赖安装（智能跳过）───────────────────────
# 通过对比 package.json 的 md5 判断是否需要重新 npm install
# 避免每次全量更新都等待漫长的依赖安装
smart_npm_install() {
  local DIR="$1"
  local LABEL="$2"
  local PROD_FLAG="${3:---production}"  # 后端用 --production，前端不传

  cd "$DIR"
  local PKG_HASH_FILE="$DIR/.pkg_hash"
  local CURRENT_HASH

  if [ -f "package.json" ]; then
    CURRENT_HASH=$(md5sum package.json | awk '{print $1}')
  else
    log_warn "$LABEL 未找到 package.json，跳过依赖安装"
    return
  fi

  if [ -f "$PKG_HASH_FILE" ] && [ "$(cat "$PKG_HASH_FILE")" = "$CURRENT_HASH" ] && [ -d "node_modules" ]; then
    log_ok "$LABEL 依赖无变化，跳过 npm install（如需强制安装请删除 $PKG_HASH_FILE）"
  else
    log_info "$LABEL 安装 npm 依赖（$PROD_FLAG）..."
    if [ "$PROD_FLAG" = "--skip-prod" ]; then
      npm install
    else
      npm install $PROD_FLAG
    fi
    echo "$CURRENT_HASH" > "$PKG_HASH_FILE"
    log_ok "$LABEL 依赖安装完成"
  fi
}

# ─────────────────────── 后端 ───────────────────────
update_backend() {
  log_section "⚙️  后端 — 安装依赖 + 重启服务"
  smart_npm_install "$PROJECT_DIR/backend" "后端" "--production"

  log_info "重启 PM2 进程：$PM2_APP_NAME ..."
  if pm2 list | grep -q "$PM2_APP_NAME"; then
    pm2 restart "$PM2_APP_NAME"
    log_ok "PM2 进程已重启"
  else
    log_warn "未找到 PM2 进程 '$PM2_APP_NAME'，尝试启动..."
    if [ -f "$PROJECT_DIR/ecosystem.config.js" ]; then
      pm2 start "$PROJECT_DIR/ecosystem.config.js"
    else
      pm2 start "$PROJECT_DIR/backend/app.js" --name "$PM2_APP_NAME"
    fi
    pm2 save
    log_ok "PM2 进程已启动并保存"
  fi
}

# ─────────────────────── 家政H5前端 ───────────────────────
update_h5() {
  log_section "🏠 家政H5前端（frontend-h5）— 构建"
  if [ ! -d "$PROJECT_DIR/frontend-h5" ]; then
    log_warn "目录 frontend-h5 不存在，跳过"
    return
  fi
  smart_npm_install "$PROJECT_DIR/frontend-h5" "家政H5" "--skip-prod"
  cd "$PROJECT_DIR/frontend-h5"
  log_info "构建家政H5..."
  npm run build
  log_ok "家政H5构建完成 → dist/"
}

# ─────────────────────── 洗衣H5前端 ───────────────────────
update_xi() {
  log_section "👕 洗衣H5前端（frontend-xi）— 构建"
  if [ ! -d "$PROJECT_DIR/frontend-xi" ]; then
    log_warn "目录 frontend-xi 不存在，跳过"
    return
  fi
  smart_npm_install "$PROJECT_DIR/frontend-xi" "洗衣H5" "--skip-prod"
  cd "$PROJECT_DIR/frontend-xi"
  log_info "构建洗衣H5..."
  npm run build
  log_ok "洗衣H5构建完成 → dist/"
}

# ─────────────────────── 充值H5前端 ───────────────────────
update_cz() {
  log_section "💎 充值H5前端（frontend-cz）— 构建"
  if [ ! -d "$PROJECT_DIR/frontend-cz" ]; then
    log_warn "目录 frontend-cz 不存在，跳过"
    return
  fi
  smart_npm_install "$PROJECT_DIR/frontend-cz" "充值H5" "--skip-prod"
  cd "$PROJECT_DIR/frontend-cz"
  log_info "构建充值H5..."
  npm run build
  log_ok "充值H5构建完成 → backend/public/cz/"
}

# ─────────────────────── 后台管理 ───────────────────────
update_admin() {
  log_section "🖥️  后台管理（frontend-admin）— 构建"
  if [ ! -d "$PROJECT_DIR/frontend-admin" ]; then
    log_warn "目录 frontend-admin 不存在，跳过"
    return
  fi
  smart_npm_install "$PROJECT_DIR/frontend-admin" "后台管理" "--skip-prod"
  cd "$PROJECT_DIR/frontend-admin"
  log_info "构建后台管理..."
  npm run build
  log_ok "后台管理构建完成 → dist/"
}

# ─────────────────────── 服务状态 ───────────────────────
show_status() {
  log_section "📊 服务状态"
  pm2 list
  echo ""
  log_info "后端最新日志（20行）："
  pm2 logs "$PM2_APP_NAME" --nostream --lines 20 2>/dev/null || true
}

# ─────────────────────── 变更说明 ───────────────────────
show_changelog() {
  echo -e "\n${MAGENTA}  📝 本次更新内容（v2.1）：${NC}"
  echo -e "${MAGENTA}  ├─ 订单中心：三业务订单统一到一个页面（方案A三Tab）${NC}"
  echo -e "${MAGENTA}  ├─ 业务设置：五业务设置统一到一个页面（通用/家政/洗衣/充值/SUP）${NC}"
  echo -e "${MAGENTA}  ├─ SUP撤单：支持三业务退款（卡密未使用→自动作废+退款）${NC}"
  echo -e "${MAGENTA}  ├─ 新接口：/admin/api/order-center/badge-counts（各业务待处理数）${NC}"
  echo -e "${MAGENTA}  └─ 菜单：「整合预留」→「业务管理」，标题去掉「整合中」${NC}\n"
}

# ─────────────────────── 主流程 ───────────────────────
main() {
  echo ""
  echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║   京东代下单系统 — 一键更新部署脚本 v2.1      ║${NC}"
  echo -e "${GREEN}║   $(date '+%Y-%m-%d %H:%M:%S')                          ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
  echo ""

  MODE="${1:-all}"

  case "$MODE" in
    all)
      # 全量更新：拉代码 + 后端 + 三套前端 + 后台管理
      show_changelog
      pull_code
      update_backend
      update_h5
      update_xi
      update_cz
      update_admin
      show_status
      ;; 
    backend)
      # 仅重启后端（后端逻辑/接口更新，无需重建前端）
      pull_code
      update_backend
      show_status
      ;; 
    admin)
      # 仅重建后台管理（前端页面/组件更新）
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
    frontend)
      # 重建全部前端，不重启后端
      pull_code
      update_h5
      update_xi
      update_cz
      update_admin
      ;; 
    sup)
      # 仅重启后端，专用于SUP/撤单逻辑更新
      log_section "🔧 SUP模式 — 拉代码 + 重启后端（不构建前端）"
      pull_code
      update_backend
      show_status
      ;; 
    order)
      # 订单中心大更新专用：拉代码 + 重建admin + 重启后端
      log_section "📋 订单中心更新模式 — 拉代码 + admin重建 + 后端重启"
      show_changelog
      pull_code
      update_admin
      update_backend
      show_status
      ;; 
    *)
      echo "用法: $0 [模式]"
      echo ""
      echo -e "  ${GREEN}all${NC}       全量更新（默认）：拉代码+后端+三套前端+后台管理"
      echo -e "  ${GREEN}backend${NC}   仅重启后端（后端逻辑/新接口更新）"
      echo -e "  ${GREEN}admin${NC}     仅重建后台管理（页面/组件更新）"
      echo -e "  ${GREEN}h5${NC}        仅重建家政H5"
      echo -e "  ${GREEN}xi${NC}        仅重建洗衣H5"
      echo -e "  ${GREEN}cz${NC}        仅重建充值H5"
      echo -e "  ${GREEN}frontend${NC}  重建全部前端（不重启后端）"
      echo -e "  ${CYAN}sup${NC}       仅重启后端（SUP/撤单逻辑更新专用）"
      echo -e "  ${CYAN}order${NC}     拉代码+admin重建+后端重启（订单中心大更新专用）"
      echo ""
      echo -e "  ${YELLOW}本次大更新推荐命令：${NC} ./update.sh order"
      exit 1
      ;;
  esac

  END_TIME=$(date +%s)
  COST=$((END_TIME - START_TIME))
  echo ""
  log_ok "全部完成！耗时 ${COST} 秒"
  echo ""
}

main "$@"