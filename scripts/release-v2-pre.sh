#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
REMOTE_ROOT="/opt/1panel/www/sites/oj.qd.sdu.edu.cn/index"
REMOTE_HOST="${SDUOJ_DEPLOY_HOST:-10.102.33.79}"
REMOTE_USER="${SDUOJ_DEPLOY_USER:-}"
REMOTE_PORT="${SDUOJ_DEPLOY_PORT:-22}"
REMOTE_KEY="${SDUOJ_DEPLOY_KEY:-}"
COMMAND_TIMEOUT="${SDUOJ_RELEASE_COMMAND_TIMEOUT_SECONDS:-600}"
RELEASE_URL="${SDUOJ_RELEASE_URL:-https://oj.qd.sdu.edu.cn/v2-pre/}"
REMOTE="${REMOTE_USER}@${REMOTE_HOST}"
SSH_ARGS=(-p "${REMOTE_PORT}" -o StrictHostKeyChecking=yes -o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=3)
if [[ -n "${REMOTE_KEY}" ]]; then
  SSH_ARGS+=(-i "${REMOTE_KEY}")
fi

die() {
  echo "release-v2-pre: $*" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing local command: $1"
}

ssh_run() {
  node "${SCRIPT_DIR}/timed-command.cjs" "${COMMAND_TIMEOUT}" ssh "${SSH_ARGS[@]}" "${REMOTE}" "$@"
}

rsync_remote() {
  node "${SCRIPT_DIR}/timed-command.cjs" "${COMMAND_TIMEOUT}" rsync -rlptDc --timeout=60 --delete --no-owner --no-group \
    -e "ssh ${SSH_ARGS[*]}" "$@"
}

require_user() {
  [[ -n "${REMOTE_USER}" ]] || die "set SDUOJ_DEPLOY_USER before running this script"
  if ! [[ "${COMMAND_TIMEOUT}" =~ ^[1-9][0-9]{0,3}$ ]] || (( COMMAND_TIMEOUT > 3600 )); then
    die "command timeout must be 1..3600 seconds"
  fi
  need_cmd node
}

plan() {
  require_user
  need_cmd ssh
  need_cmd rsync
  need_cmd curl
  ssh_run "test -d '${REMOTE_ROOT}' &&
    test -d '${REMOTE_ROOT}/v2-pre' &&
    test -d '${REMOTE_ROOT}/v2-pre-backup' &&
    test -w '${REMOTE_ROOT}/v2-pre' &&
    test -w '${REMOTE_ROOT}/v2-pre-backup' &&
    command -v rsync >/dev/null &&
    command -v node >/dev/null &&
    command -v timeout >/dev/null"
  echo "remote plan OK: ${REMOTE} (${REMOTE_ROOT}/v2-pre)"
  echo "release URL: ${RELEASE_URL}"
  echo "formal /v2 is never touched by this script"
}

check_toolchain() {
  need_cmd node
  need_cmd yarn
  local node_major yarn_version
  node_major="$(node -p 'process.versions.node.split(".")[0]')"
  [[ "${node_major}" == "24" ]] || die "Node 24 is required for release; found $(node -v)"
  yarn_version="$(yarn --version)"
  [[ "${yarn_version}" == "1.22.22" ]] || die "Yarn 1.22.22 is required; found ${yarn_version}"
}

build_pre() {
  check_toolchain
  cd -- "${PROJECT_ROOT}"
  if [[ -d build ]]; then
    find build -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
  fi
  node "${SCRIPT_DIR}/timed-command.cjs" 900 yarn install --frozen-lockfile --non-interactive
  node "${SCRIPT_DIR}/timed-command.cjs" 900 yarn build:pre
  [[ -s build/index.html ]] || die "build/index.html is missing"
  grep -q '/v2-pre/' build/index.html || die "build/index.html does not contain /v2-pre/"
  node -e "const m=require('./build/manifest.json'); if(m.start_url !== '/v2-pre/home') process.exit(1)"
}

smoke() {
  need_cmd curl
  curl --fail --silent --show-error --location --connect-timeout 10 --max-time 45 --retry 3 --retry-delay 2 --retry-max-time 180 "${RELEASE_URL}" |
    grep -q '<div id="root"></div>' ||
    { echo "smoke test failed: ${RELEASE_URL}" >&2; return 1; }
  echo "smoke OK: ${RELEASE_URL}"
}

remote_apply() {
  local release_id="$1"
  local stage=".v2-pre-release-${release_id}"
  local backup_new=".v2-pre-backup-new-${release_id}"
  local backup_old=".v2-pre-backup-old-${release_id}"
  ssh_run timeout "${COMMAND_TIMEOUT}" bash -s <<EOF
set -Eeuo pipefail
root="${REMOTE_ROOT}"
stage="${stage}"
backup_new="${backup_new}"
backup_old="${backup_old}"
current="\$root/v2-pre"
backup="\$root/v2-pre-backup"
test -s "\$root/\$stage/index.html"
grep -q '/v2-pre/' "\$root/\$stage/index.html"

if [ -e "\$root/\$backup_new" ] || [ -e "\$root/\$backup_old" ]; then
  echo "backup paths already exist; use a new release id; existing recovery copies retained" >&2
  exit 1
fi
test -s "\$current/index.html"
grep -q '/v2-pre/' "\$current/index.html"
if ! rsync -rlptDc --timeout=60 --delete --no-owner --no-group "\$current/" "\$root/\$backup_new/"; then
  rm -rf "\$root/\$backup_new"
  exit 1
fi
if [ -e "\$backup" ]; then
  mv "\$backup" "\$root/\$backup_old"
fi
if ! mv "\$root/\$backup_new" "\$backup"; then
  if [ -e "\$root/\$backup_old" ]; then mv "\$root/\$backup_old" "\$backup"; fi
  exit 1
fi

cat > "\$root/rollback-v2-pre.sh" <<'ROLLBACK'
#!/usr/bin/env bash
set -Eeuo pipefail
root="${REMOTE_ROOT}"
test -s "\$root/v2-pre-backup/index.html"
timeout 300 rsync -rlptDc --timeout=60 --delete --no-owner --no-group "\$root/v2-pre-backup/" "\$root/v2-pre/"
test -s "\$root/v2-pre/index.html"
grep -q '/v2-pre/' "\$root/v2-pre/index.html"
echo "v2-pre rollback complete"
ROLLBACK
chmod 0755 "\$root/rollback-v2-pre.sh"

if ! rsync -rlptDc --timeout=60 --delete --no-owner --no-group "\$root/\$stage/" "\$current/"; then
  if ! rsync -rlptDc --timeout=60 --delete --no-owner --no-group "\$backup/" "\$current/"; then
    echo "apply and recovery failed; backup, older backup and stage retained for manual recovery" >&2
    exit 1
  fi
  echo "apply failed; current restored; both recovery copies retained" >&2
  rm -rf "\$root/\$stage"
  exit 1
fi
rm -rf "\$root/\$backup_old" "\$root/\$stage"
test -s "\$current/index.html"
EOF
}

deploy() {
  require_user
  build_pre
  plan
  smoke || die "pre-deploy smoke failed; remote releases were not changed"
  local release_id="${1:-$(date -u +%Y%m%d%H%M%S)-$(git -C "${PROJECT_ROOT}" rev-parse --short HEAD 2>/dev/null || echo local)}"
  [[ "${release_id}" =~ ^[A-Za-z0-9._-]+$ ]] || die "invalid release id"
  local source_ref
  source_ref="$(git -C "${PROJECT_ROOT}" rev-parse HEAD)"
  [[ "${source_ref}" =~ ^[a-f0-9]{40}$ ]] || die "invalid source ref"
  node "${PROJECT_ROOT}/scripts/release-artifact.cjs" verify "${PROJECT_ROOT}/build" "${source_ref}" /v2-pre/ "${RELEASE_URL}"
  local stage=".v2-pre-release-${release_id}"
  local validator=".v2-pre-validator-${release_id}.cjs"
  ssh_run "install -d -m 0755 '${REMOTE_ROOT}/${stage}'"
  if ! rsync_remote "${PROJECT_ROOT}/build/" "${REMOTE}:${REMOTE_ROOT}/${stage}/"; then
    ssh_run "rm -rf '${REMOTE_ROOT}/${stage}'" || true
    die "staging rsync failed; formal /v2 was not touched"
  fi
  if ! rsync_remote "${PROJECT_ROOT}/scripts/release-artifact.cjs" "${REMOTE}:${REMOTE_ROOT}/${validator}"; then
    ssh_run "rm -rf '${REMOTE_ROOT}/${stage}'" || true
    die "validator upload failed; current release was not touched"
  fi
  if ! ssh_run "node '${REMOTE_ROOT}/${validator}' verify '${REMOTE_ROOT}/${stage}' '${source_ref}' /v2-pre/ '${RELEASE_URL}' > '${REMOTE_ROOT}/.v2-pre-validation-${release_id}.json'"; then
    ssh_run "rm -rf '${REMOTE_ROOT}/${stage}'; rm -f '${REMOTE_ROOT}/${validator}'" || true
    die "staged artifact validation failed; current release was not touched"
  fi
  ssh_run "rm -f '${REMOTE_ROOT}/${validator}'"
  if ! remote_apply "${release_id}"; then
    die "remote apply failed; staging and recovery copies retained; formal /v2 was not touched"
  fi
  if ! smoke; then
    echo "post-deploy smoke failed; restoring v2-pre from v2-pre-backup" >&2
    ssh_run timeout "${COMMAND_TIMEOUT}" bash -s <<EOF
set -Eeuo pipefail
root="${REMOTE_ROOT}"
rsync -rlptDc --timeout=60 --delete --no-owner --no-group "\$root/v2-pre-backup/" "\$root/v2-pre/"
EOF
    smoke || die "post-rollback smoke failed; backup retained for manual recovery"
    die "post-deploy smoke failed; rollback attempted"
  fi
  echo "v2-pre deploy complete: ${RELEASE_URL}"
  echo "one-click remote rollback: ssh ${REMOTE} ${REMOTE_ROOT}/rollback-v2-pre.sh"
}

rollback() {
  require_user
  plan
  ssh_run timeout "${COMMAND_TIMEOUT}" bash -s <<EOF
set -Eeuo pipefail
root="${REMOTE_ROOT}"
test -s "\$root/v2-pre-backup/index.html"
rsync -rlptDc --timeout=60 --delete --no-owner --no-group "\$root/v2-pre-backup/" "\$root/v2-pre/"
test -s "\$root/v2-pre/index.html"
grep -q '/v2-pre/' "\$root/v2-pre/index.html"
EOF
  smoke
  echo "v2-pre rollback complete: ${RELEASE_URL}"
}

usage() {
  cat <<'USAGE'
Usage:
  scripts/release-v2-pre.sh plan
  scripts/release-v2-pre.sh deploy [release-id]
  scripts/release-v2-pre.sh rollback

Required environment:
  SDUOJ_DEPLOY_USER       SSH user (for example: sducs)
Optional environment:
  SDUOJ_DEPLOY_HOST       default: 10.102.33.79
  SDUOJ_DEPLOY_PORT       default: 22
  SDUOJ_DEPLOY_KEY        SSH private-key path; without it, ssh may prompt for a password
  SDUOJ_RELEASE_URL       default: https://oj.qd.sdu.edu.cn/v2-pre/
  SDUOJ_RELEASE_COMMAND_TIMEOUT_SECONDS  per SSH/rsync command, default: 600 (1..3600)
USAGE
}

case "${1:-}" in
  plan) plan ;;
  deploy) deploy "${2:-}" ;;
  rollback) rollback ;;
  *) usage; exit 2 ;;
esac
