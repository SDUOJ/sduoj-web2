# SDUOJ Web2 本机发布 v2-pre

本流程从本机把新的前端同步到内网生产服务器的独立测试路由。生产正式入口 / 和正式静态目录 v2 不由本流程写入；GitHub Actions 也不负责生产发布。

## 一次性人工准备

以下操作需要管理员在 1Panel/OpenResty 面板中手动完成，本仓库不会执行：

1. 在站点根目录 /opt/1panel/www/sites/oj.qd.sdu.edu.cn/index 下创建可写目录 v2-pre 和 v2-pre-backup，并给 SSH 用户 sducs 写权限。
2. 为独立测试入口增加路由。容器内路径通常是 /www/sites/oj.qd.sdu.edu.cn/index/v2-pre，请以面板实际挂载路径为准：

   location = /v2-pre {
   return 302 /v2-pre/;
   }

   location ^~ /v2-pre/ {
   alias /www/sites/oj.qd.sdu.edu.cn/index/v2-pre/;
   index index.html;
   try_files $uri $uri/ /v2-pre/index.html;
   }

不要修改现有 / 或 /v2 的 location。保存配置并由管理员在面板中检查配置后，再执行本机的 plan；plan 只读检查目录、权限和远端 rsync，不会创建目录或改配置。

## 本机环境

发布脚本要求 Node 24 和 Yarn 1.22.22。建议使用仓库的 .nvmrc 或等价的 Node 24 环境。脚本不会保存 SSH 密码；优先使用仅限该目录权限的 SSH key，也可以在交互式终端中输入密码。

    cd /Users/yhf2000/Desktop/project/sduoj-dev/sduoj-web2
    export SDUOJ_DEPLOY_USER=sducs
    export SDUOJ_DEPLOY_HOST=10.102.33.79
    export SDUOJ_RELEASE_URL=https://oj.qd.sdu.edu.cn/v2-pre/
    export SDUOJ_DEPLOY_KEY=$HOME/.ssh/sduoj-web2-pre

先做只读检查：

    scripts/release-v2-pre.sh plan

发布流程会先本机构建并验证 /v2-pre/，然后访问现有测试 URL，确认入口已配置，之后才会写入远端暂存目录。远端写入顺序是：

1. 把当前 v2-pre 用 checksum-aware rsync 保存到 v2-pre-backup；
2. 把构建产物同步到 v2-pre；
3. 写入远端一键回滚脚本 /opt/1panel/www/sites/oj.qd.sdu.edu.cn/index/rollback-v2-pre.sh；
4. 发布后再次进行 HTTP smoke test，失败时自动从 v2-pre-backup 恢复。

   scripts/release-v2-pre.sh deploy
   scripts/release-v2-pre.sh rollback

也可以指定一个便于审计的发布编号：

    scripts/release-v2-pre.sh deploy 20261004-rc1

远端一键回滚：

    ssh sducs@10.102.33.79 /opt/1panel/www/sites/oj.qd.sdu.edu.cn/index/rollback-v2-pre.sh

## 安全边界

脚本固定只操作：

    /opt/1panel/www/sites/oj.qd.sdu.edu.cn/index/v2-pre
    /opt/1panel/www/sites/oj.qd.sdu.edu.cn/index/v2-pre-backup

正式目录 /opt/1panel/www/sites/oj.qd.sdu.edu.cn/index/v2 从未作为目标路径传给 rsync。首次使用前应由管理员人工验证 Nginx 路由、目录 ACL、SSH host key 和 SDUOJ_RELEASE_URL；本次仓库变更没有连接服务器，也没有执行任何生产写操作。
