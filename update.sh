#!/bin/bash
# ============================================================
#  京东代下单系统 — 一键拉取更新 + 重新构建 + 重启
#  使用方式：
#    chmod +x update.sh   （首次执行前赋予可执行权限）
#    ./update.sh          （全量更新：后端+两套前端+后台管理）
#    ./update.sh backend  （仅重启后端）
#    ./update.sh h5       （仅重建家政H5）
#    ./update.sh xi       （仅重建洗衣H5）
#    ./update.sh admin    （仅重建后台管理）
# ============================================================

set -e   # 任意命令失败立即退出

# ─────────────────────── 配置区 ───────────────────────
# 根据实际部署路径修改
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PM2_APP_NAME="jdjiazheng"          # pm2 进程名（与 pm2 start 时一致）
# ──────────────────────────────────────────────────────

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # 无颜色

log_info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()      { echo -e "${GREEN}[✓]${NC}    $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
log_section() { echo -e "\n${CYAN}══════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}══════════════════════════════════════${NC}"; }

# 记录开始时间
START_TIME=$(date +%s)

# ─────────────────────── 拉取代码 ───────────────────────
pull_code() {
  log_section "📥 拉取最新代码（git pull）"
  cd "$PROJECT_DIR"
  if ! git diff --quiet; then
    log_warn "检测到本地有未提交的修改，跳过 git pull（避免冲突）"
    log_warn "如需强制更新，请先执行：git stash 或 git checkout -- ."
    echo ""
  else
    git pull origin main
    log_ok "代码拉取完成"
  fi
}

# ─────────────────────── 后端 ───────────────────────
update_backend() {
  log_section "⚙️  后端 — 安装依赖 + 重启服务"
  cd "$PROJECT_DIR/backend"

  log_info "安装后端 npm 依赖..."
  npm install --production
  log_ok "后端依赖安装完成"

  log_info "重启 PM2 进程：$PM2_APP_NAME ..."
  if pm2 list | grep -q "$PM2_APP_NAME"; then
    pm2 restart "$PM2_APP_NAME"
    log_ok "PM2 进程已重启"
  else
    log_warn "未找到 PM2 进程 '$PM2_APP_NAME'，尝试以 ecosystem 方式启动..."
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
  cd "$PROJECT_DIR/frontend-h5"

  log_info "安装家政H5依赖..."
  npm install
  log_ok "依赖安装完成"

  log_info "构建家政H5（npm run build）..."
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
  cd "$PROJECT_DIR/frontend-xi"

  log_info "安装洗衣H5依赖..."
  npm install
  log_ok "依赖安装完成"

  log_info "构建洗衣H5（npm run build）..."
  npm run build
  log_ok "洗衣H5构建完成 → dist/"
}

# ─────────────────────── 后台管理 ───────────────────────
update_admin() {
  log_section "🖥️  后台管理（frontend-admin）— 构建"
  if [ ! -d "$PROJECT_DIR/frontend-admin" ]; then
    log_warn "目录 frontend-admin 不存在，跳过"
    return
  fi
  cd "$PROJECT_DIR/frontend-admin"

  log_info "安装后台管理依赖..."
  npm install
  log_ok "依赖安装完成"

  log_info "构建后台管理（npm run build）..."
  npm run build
  log_ok "后台管理构建完成 → dist/"
}

# ─────────────────────── 状态汇总 ───────────────────────
show_status() {
  log_section "📊 服务状态"
  pm2 list
  echo ""
  log_info "后端日志（最后20行）："
  pm2 logs "$PM2_APP_NAME" --nostream --lines 20 2>/dev/null || true
}

# ─────────────────────── 主流程 ───────────────────────
main() {
  echo ""
  echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║   京东代下单系统 — 一键更新部署脚本       ║${NC}"
  echo -e "${GREEN}║   $(date '+%Y-%m-%d %H:%M:%S')                      ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
  echo ""

  MODE="${1:-all}"

  case "$MODE" in
    all)
      pull_code
      update_backend
      update_h5
      update_xi
      update_admin
      show_status
      ;;
    backend)
      update_backend
      show_status
      ;;
    h5)
      pull_code
      update_h5
      ;;
    xi)
      pull_code
      update_xi
      ;;
    admin)
      pull_code
      update_admin
      ;;
    frontend)
      # 同时更新两套前端 + 后台，不重启后端
      pull_code
      update_h5
      update_xi
      update_admin
      ;;
    *)
      echo "用法: $0 [all|backend|h5|xi|admin|frontend]"
      echo ""
      echo "  all       全量更新（默认）：拉代码+后端+两套前端+后台管理"
      echo "  backend   仅重启后端服务（不构建前端）"
      echo "  h5        仅重建家政H5前端"
      echo "  xi        仅重建洗衣H5前端"
      echo "  admin     仅重建后台管理"
      echo "  frontend  重建全部前端（不重启后端）"
      exit 1
      ;;
  esac

  # 计算耗时
  END_TIME=$(date +%s)
  COST=$((END_TIME - START_TIME))
  echo ""
  log_ok "全部完成！耗时 ${COST} 秒"
  echo ""
}

main "$@"