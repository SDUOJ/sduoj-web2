# SDUOJ Front End - React

This response is a web system that use ``React`` to adapt more services of SDUOJ.

This system is still in its early stages and there are still a large number of issues to be resolved.

> Warning: This code currently contains a large number of unfixed warnings and has some performance issues, but is believed to be fixed in the future. (2023/02/19)


## How to build

To build it, you need a version 16.x of ``nodejs``.

To change you nodejs version, we recommend you ues [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows).

As the first time you run the code, you need to install modules:

```shell
npm install -g yarn
yarn install
```

If you want to run it for development, run:

```shell
yarn start
```

If you want to build a release package, run:

```shell
yarn build
```
Then you can find all the files in the build directory that can be accessed directly using a proxy server such as nginx.
