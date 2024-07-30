# SDUOJ Front End - React

This response is a web system that use ``React`` to adapt more services of SDUOJ.

This system is still in its early stages and there are still a large number of issues to be resolved.

> Warning: This code currently contains a large number of unfixed warnings and has some performance issues, but is believed to be fixed in the future. (2023/02/19)


## Prepare the environment

To build it, you need a version 16.x of ``nodejs``.

To change you nodejs version, we recommend you ues [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows).

As the first time you run the code, you need to install modules:

```shell
npm install -g yarn
yarn install
```

## How to run (on windows)

If you want to run it for development, You need to first create 
the https certificate for your local project.

1.  With ``PowerShell``, in the root of this project:
    ```shell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    Invoke-Expression (New-Object System.Net.WebClient).DownloadString('https://get.scoop.sh')
    scoop bucket add extras
    scoop install mkcert
    mkcert -install
    mkcert -key-file ./.cert/key.pem -cert-file ./.cert/cert.pem "localhost"
    ```
    Change the start in package.json to "start": "cross-env HTTPS=true SSL_CRT_FILE=./.cert/cert.pem   SSL_KEY_FILE=./.cert/key.pem node scripts/start.js".
    Then,modify './src/utils/API/apiAddress.js' http to https in devlopment environment.

3. Install a proxy server for nginx, modify its configuration file,
listen on ``8889`` as the SSL port, and forward routes ``\api`` to ``localhost:8080``.
    ```
    server {
        listen       8889 ssl;
        server_name  localhost;
    
        ssl_certificate      /path/to/project_root/.cert/cert.pem;
        ssl_certificate_key  /path/to/project_root/.cert/key.pem;
    
        ssl_session_cache    shared:SSL:1m;
        ssl_session_timeout  5m;
    
        ssl_ciphers  HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers  on;
    
        location /api/ {
            proxy_pass   http://localhost:8080;
        }
    }
    ```
4. Run:

```shell
start nginx
yarn start
```

## How to build

If you want to build a release package, run:

```shell
yarn build
```
Then you can find all the files in the build directory that can be accessed directly using a proxy server such as nginx.
