## 1.0.0 (2026-08-22)


### Features

* add missing constraints between wallets and transactions ([9929ddc](https://github.com/MCesarczyk/home-budget-planner/commit/9929ddc0dd4c7abc85954361d81da60649d31d6d))
* add transactions app ([cc0abf5](https://github.com/MCesarczyk/home-budget-planner/commit/cc0abf5a1acab2e3562651f349883b8e19b7a671))
* create seed data ([d87c843](https://github.com/MCesarczyk/home-budget-planner/commit/d87c843ff5ee91447af83a022dab9b3b50ed01e9))
* create tables in transaction module ([7974be6](https://github.com/MCesarczyk/home-budget-planner/commit/7974be67b383cf69762a9249e56c3e5cf2899428))
* create wallets module with accounts with purposes ([06c12a0](https://github.com/MCesarczyk/home-budget-planner/commit/06c12a042c176a22c68d851f3f23be790b2ecb44))
* register transactions models in admin, update displayed names ([2a970fd](https://github.com/MCesarczyk/home-budget-planner/commit/2a970fd59b65232b22426148f5e111e101e56735))
* replace transactions table with list of tiles on mobile ([#22](https://github.com/MCesarczyk/home-budget-planner/issues/22)) ([6d14fac](https://github.com/MCesarczyk/home-budget-planner/commit/6d14fac081544ce07364a8a05a4b087adc11685d))
* scaffold django app ([a1636cf](https://github.com/MCesarczyk/home-budget-planner/commit/a1636cfc092324a6761789a9293e84081ab3f025))
* update frontend responsiveness ([#20](https://github.com/MCesarczyk/home-budget-planner/issues/20)) ([67bbb73](https://github.com/MCesarczyk/home-budget-planner/commit/67bbb73b9df4ce606d531d6524ac90749309b2d5))
* update migrations seed data ([03fcc3a](https://github.com/MCesarczyk/home-budget-planner/commit/03fcc3ac5f1b50e493de0fd02eb6898e9825487c))


### Bug Fixes

* change purpose off budget flag to be mandatory, align seed data ([#18](https://github.com/MCesarczyk/home-budget-planner/issues/18)) ([b0db684](https://github.com/MCesarczyk/home-budget-planner/commit/b0db6849244833768edbaf64d21b80ee4b7f3766))


### Documentation

* add project readme ([#15](https://github.com/MCesarczyk/home-budget-planner/issues/15)) ([eb51ccb](https://github.com/MCesarczyk/home-budget-planner/commit/eb51ccb7b17ada67280ab4550fb1495f5ca33375))
* plan db structure ([f81a3af](https://github.com/MCesarczyk/home-budget-planner/commit/f81a3af6eed0923c9c75653e517a29bd1967c640))
* update design status in docs ([b928a3d](https://github.com/MCesarczyk/home-budget-planner/commit/b928a3d3c0680076de1f74a0ca66155610488cfe))
* update schema design ([f84ad99](https://github.com/MCesarczyk/home-budget-planner/commit/f84ad9947aa809431980141ebc071dc27853cb10))


### Code Refactors

* merge services with proper deployments ([50bf922](https://github.com/MCesarczyk/home-budget-planner/commit/50bf9224ce399a4a2ef2b97a412bc987eae57307))


### Build System

* initialize poetry, install django ([afbf73a](https://github.com/MCesarczyk/home-budget-planner/commit/afbf73abb3ecb66bc1954b7cfe32894dd7ba1739))


### CI/CD

* add persistent db version for public cloud env ([014ea36](https://github.com/MCesarczyk/home-budget-planner/commit/014ea360ba3ea7aab14dfcdeeef721fd7bbdbb76))
* attach dockerhub to build-push actions ([#16](https://github.com/MCesarczyk/home-budget-planner/issues/16)) ([7d1682c](https://github.com/MCesarczyk/home-budget-planner/commit/7d1682c75893cc1af898d284e62580a19cce1d89))
* create local gating for CI, add commit message check in repo ([3b7540a](https://github.com/MCesarczyk/home-budget-planner/commit/3b7540affe5484ca669e5cb93e2a6b4ad47e22f2))
* dockerize app ([a42a1a7](https://github.com/MCesarczyk/home-budget-planner/commit/a42a1a73c3608ad76e480f81974fc87051d0ec27))
* replace init container with job ([3093a95](https://github.com/MCesarczyk/home-budget-planner/commit/3093a950688e8631f917c9b9cb3fbc7f5ced34ba))
* semantic release [skip ci] ([#21](https://github.com/MCesarczyk/home-budget-planner/issues/21)) ([c1a9c5d](https://github.com/MCesarczyk/home-budget-planner/commit/c1a9c5d93cd75112d7598d9eae68edb2dbea7d27))
* update workflows to  also support arm64 ([#17](https://github.com/MCesarczyk/home-budget-planner/issues/17)) ([9ffa5f1](https://github.com/MCesarczyk/home-budget-planner/commit/9ffa5f16863b569556a35a749dea0ea041c38f8d))
