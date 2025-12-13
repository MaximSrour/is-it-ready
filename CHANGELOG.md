## [1.4.2](https://github.com/MaximSrour/is-it-ready/compare/v1.4.1...v1.4.2) (2025-12-13)


### Bug Fixes

* update failure messages for suite handling in parseVitest ([230f934](https://github.com/MaximSrour/is-it-ready/commit/230f934b013b618d166d646347171fc17616c63d))

## [1.4.1](https://github.com/MaximSrour/is-it-ready/compare/v1.4.0...v1.4.1) (2025-12-13)


### Bug Fixes

* enhance parseVitest to handle suite failures ([66a3888](https://github.com/MaximSrour/is-it-ready/commit/66a3888ff3ae51a6d622679625b25418c3e7346a))
* properly validate integer input ([a9dd81a](https://github.com/MaximSrour/is-it-ready/commit/a9dd81a088357f47de5683c300cb57cdcb4dd46d))

# [1.4.0](https://github.com/MaximSrour/is-it-ready/compare/v1.3.1...v1.4.0) (2025-12-13)


### Bug Fixes

* ensure isRunning flag is reset after rerunning tasks ([2730030](https://github.com/MaximSrour/is-it-ready/commit/27300306cac552df88ffb130c3a70f3a2eb6a233))
* update file watcher to ignore .git directory ([8f3132a](https://github.com/MaximSrour/is-it-ready/commit/8f3132aa0e854c77ae405558b28e400f5c03b738))


### Features

* add --watch flag to re-run tasks on file changes ([124f51d](https://github.com/MaximSrour/is-it-ready/commit/124f51dfa78d8e4fec1a9282976008a652f49644))
* add chokidar for file watching and rerun tasks on changes ([dc365e8](https://github.com/MaximSrour/is-it-ready/commit/dc365e87a12348b106f0804fc955304cb3b93750))
* add support for watchIgnore files in config ([c83a8c9](https://github.com/MaximSrour/is-it-ready/commit/c83a8c9da9c6161904c6dfcada7b3145ed2252dd))
* enables configuration of watchIgnore files ([401d533](https://github.com/MaximSrour/is-it-ready/commit/401d533a138329dfe9243e6f499b832fa76169f5))

## [1.3.1](https://github.com/MaximSrour/is-it-ready/compare/v1.3.0...v1.3.1) (2025-12-13)


### Bug Fixes

* remove the concept of loose commands entirely ([127d1e7](https://github.com/MaximSrour/is-it-ready/commit/127d1e7298ac5af5e2f931e87941068a5423d8a8))

# [1.3.0](https://github.com/MaximSrour/is-it-ready/compare/v1.2.6...v1.3.0) (2025-12-13)


### Bug Fixes

* add error handling for multiple config arguments in getRunOptions ([097e3a8](https://github.com/MaximSrour/is-it-ready/commit/097e3a8b879b4f6a241009805e415d97b89073dc))
* correct MarkdownLint syntax in documentation ([b139ef9](https://github.com/MaximSrour/is-it-ready/commit/b139ef9c1f82d2e7daf7c22717f3ffae6bb25d56))
* corrected global install config loading logic ([6b0fc1c](https://github.com/MaximSrour/is-it-ready/commit/6b0fc1c5c86edd8eca61c2330c4cccf503d616f5))
* improve configuration loading logic and error handling in getConfig function ([cd2b72d](https://github.com/MaximSrour/is-it-ready/commit/cd2b72d2ab9c9b5944002016ec40fbf96cd9388b))
* refactor configuration loading to use constants for search places ([0040592](https://github.com/MaximSrour/is-it-ready/commit/0040592e36d4077f20f400f1729367b93d87f193))
* remove unnecessary peer dependencies from package-lock.json ([432faad](https://github.com/MaximSrour/is-it-ready/commit/432faad4b03189815420ee730bf16749604afae8))
* update error message for missing user configuration to include README reference ([4d6c83c](https://github.com/MaximSrour/is-it-ready/commit/4d6c83c896db56f2ec8928530ad77cd61998f7d2))


### Features

* add support for custom configuration file path in CLI and update related tests ([8969616](https://github.com/MaximSrour/is-it-ready/commit/8969616ad428b3edb94b5a966207b23b943597c7))
* add user configuration support and update task loading mechanism ([c202bf7](https://github.com/MaximSrour/is-it-ready/commit/c202bf76c1a8da57f1d22ac14d2e94ac14ced76e))

## [1.2.6](https://github.com/MaximSrour/is-it-ready/compare/v1.2.5...v1.2.6) (2025-12-12)


### Bug Fixes

* merge conflict resolution ([9ef7135](https://github.com/MaximSrour/is-it-ready/commit/9ef7135c5f3b2049a21ac800e25bf8fa6c4ffaf1))

## [1.2.5](https://github.com/MaximSrour/is-it-ready/compare/v1.2.4...v1.2.5) (2025-12-12)


### Bug Fixes

* update regex to correctly parse singular vulnerability in npm audit output ([a8cb0fb](https://github.com/MaximSrour/is-it-ready/commit/a8cb0fba7d5161105278b176f6b55221f68c94fc))

## [1.2.4](https://github.com/MaximSrour/is-it-ready/compare/v1.2.3...v1.2.4) (2025-12-10)


### Bug Fixes

* simplify the label decoration and combine both processes into the select command function ([f031843](https://github.com/MaximSrour/is-it-ready/commit/f0318431313a56d0c0b769877a73f11a9ca53bdf))

## [1.2.3](https://github.com/MaximSrour/is-it-ready/compare/v1.2.2...v1.2.3) (2025-12-10)


### Bug Fixes

* add a notice to indicate the fix mode is enabled and mark supported  tasks ([3d939cd](https://github.com/MaximSrour/is-it-ready/commit/3d939cda7041a4a8ab1f3b73cd704794c5006a1b))
* refactor decorateLabel to prioritize fix mode and update tests accordingly ([c1a96e8](https://github.com/MaximSrour/is-it-ready/commit/c1a96e8706efdf3bcf49b9de4539fcfb4189454e))
* refactor selectCommand to use StepConfig and simplify command selection logic ([aa18316](https://github.com/MaximSrour/is-it-ready/commit/aa18316db04c9075f8881150bf056cae66f4608c))

## [1.2.2](https://github.com/MaximSrour/is-it-ready/compare/v1.2.1...v1.2.2) (2025-12-10)


### Bug Fixes

* move icons into helper modules ([16b311c](https://github.com/MaximSrour/is-it-ready/commit/16b311ca940c167b6bd1a477b479d66d42e36e93))

## [1.2.1](https://github.com/MaximSrour/is-it-ready/compare/v1.2.0...v1.2.1) (2025-12-10)


### Bug Fixes

* remove trailing spaces and improve placeholder text ([05c8301](https://github.com/MaximSrour/is-it-ready/commit/05c83016e09bca361f15361bbe86c33bc0523cf3))

# [1.2.0](https://github.com/MaximSrour/is-it-ready/compare/v1.1.10...v1.2.0) (2025-12-09)


### Bug Fixes

* markdown error in README and help.md ([533ecdd](https://github.com/MaximSrour/is-it-ready/commit/533ecdd108e43befdbd6e8e0f83530e36b6efe77))


### Features

* add --fix flag description to README and help.md ([e95a7df](https://github.com/MaximSrour/is-it-ready/commit/e95a7df3d173bc2565df17470908206cf45c4cce))
* add --fix prefix support and unified command selection logic ([fac865d](https://github.com/MaximSrour/is-it-ready/commit/fac865d64f2aa3435495704506b5b5f00e67a183))

## [1.1.10](https://github.com/MaximSrour/is-it-ready/compare/v1.1.9...v1.1.10) (2025-12-09)


### Bug Fixes

* add check to only update latest tag when new release is created ([a234600](https://github.com/MaximSrour/is-it-ready/commit/a234600a1a6f2f5c01d60672ded4146e1baf0acc))
* add git config for user identity before tagging ([4e562a6](https://github.com/MaximSrour/is-it-ready/commit/4e562a6ffc968b3b8708daac82c7c101ae74939d))
* add step to create and update latest tag on release ([930d365](https://github.com/MaximSrour/is-it-ready/commit/930d365761df191d61b5d1a4bf673bd76f52b2b6))
* create a separate ci file for updating the latest tag ([63789a6](https://github.com/MaximSrour/is-it-ready/commit/63789a6045d0a1b735c6803e81b4864c08a58c4b))

## [1.1.9](https://github.com/MaximSrour/is-it-ready/compare/v1.1.8...v1.1.9) (2025-12-09)


### Bug Fixes

* address code review feedback ([11053ac](https://github.com/MaximSrour/is-it-ready/commit/11053ac222f67cb949d935f30c9bd076a1630665))
* address code review feedback ([4238aef](https://github.com/MaximSrour/is-it-ready/commit/4238aef788a8535425ec8078c55b91d5790ff786))
* align version and help flags with GNU standards ([94f5d21](https://github.com/MaximSrour/is-it-ready/commit/94f5d213807ef9191a8b8f8e4eef07c1a824631e))
* refactor run options handling and add help documentation ([d03a9c3](https://github.com/MaximSrour/is-it-ready/commit/d03a9c38f620be3e99be5707aed935ebff4222a6))
* use cross-platform file copy for build script ([4f10f16](https://github.com/MaximSrour/is-it-ready/commit/4f10f16ffcb0c34ff7769e101e26e12c4eb87263))

## [1.1.8](https://github.com/MaximSrour/is-it-ready/compare/v1.1.7...v1.1.8) (2025-12-09)


### Bug Fixes

* clean up assets array in release configuration ([d3b2914](https://github.com/MaximSrour/is-it-ready/commit/d3b2914fae724d73a62065b28124f69efe9b25a0))
* update .gitignore to include /dist and remove it from release assets ([e20db6b](https://github.com/MaximSrour/is-it-ready/commit/e20db6bcd35373d748dddfcaaa636649c9764b86))

## [1.1.7](https://github.com/MaximSrour/is-it-ready/compare/v1.1.6...v1.1.7) (2025-12-08)


### Bug Fixes

* improve rendering of failure details and update function signatures ([1a5ec45](https://github.com/MaximSrour/is-it-ready/commit/1a5ec4595e91faa7d2f49e3f71f951d529f1d9da))

## [1.1.6](https://github.com/MaximSrour/is-it-ready/compare/v1.1.5...v1.1.6) (2025-12-08)


### Bug Fixes

* add case for showing help and version flags together ([99c026b](https://github.com/MaximSrour/is-it-ready/commit/99c026b4d89b6c8deec1c95d755ba5d5bc0ca1eb))
* create a version flag for the cli ([9eefb58](https://github.com/MaximSrour/is-it-ready/commit/9eefb5833e2e0f9577c4b24471e477d8c333553e))

## [1.1.5](https://github.com/MaximSrour/is-it-ready/compare/v1.1.4...v1.1.5) (2025-12-08)


### Bug Fixes

* add markdown linting support and update help documentation ([4a65f74](https://github.com/MaximSrour/is-it-ready/commit/4a65f7434c67730383f26ac2209146056dc90db4))
* update prettier ([f118d70](https://github.com/MaximSrour/is-it-ready/commit/f118d706ebfb1ccd3dd2db98b19545da9f1a00e5))

## [1.1.4](https://github.com/MaximSrour/is-it-ready/compare/v1.1.3...v1.1.4) (2025-12-07)


### Bug Fixes

* create a no op function ([87d083a](https://github.com/MaximSrour/is-it-ready/commit/87d083a37deeb581bf4f547779f255d88793d84f))
* implement getRunOptions to parse command-line arguments for run modes ([ae6d325](https://github.com/MaximSrour/is-it-ready/commit/ae6d3251a072d470101a31ef67e40909105af319))
* refactor colorStatusMessage function and add tests for its behavior ([3528fde](https://github.com/MaximSrour/is-it-ready/commit/3528fde80520b20203a1e6855e3fcaa96a669ff7))
* removed problematic test (can be readded another time) ([80873d3](https://github.com/MaximSrour/is-it-ready/commit/80873d3b6fcf129d30302af28b674d9901c8969d))
* update test runner to force color on ([8bfe88b](https://github.com/MaximSrour/is-it-ready/commit/8bfe88b611f812e501bdd0573b796cba844d0147))

## [1.1.3](https://github.com/MaximSrour/is-it-ready/compare/v1.1.2...v1.1.3) (2025-12-07)


### Bug Fixes

* add loose command for Type Checking step ([ccb67bd](https://github.com/MaximSrour/is-it-ready/commit/ccb67bdb91e712f0c88498c9a4721caf9b6ad9bc))

## [1.1.2](https://github.com/MaximSrour/is-it-ready/compare/v1.1.1...v1.1.2) (2025-12-07)


### Bug Fixes

* parallelize task execution ([702d2ee](https://github.com/MaximSrour/is-it-ready/commit/702d2eec89158295cb69c7947df6d175e063f0b1))

## [1.1.1](https://github.com/MaximSrour/is-it-ready/compare/v1.1.0...v1.1.1) (2025-12-07)


### Bug Fixes

* enhance table rendering with bold headers and footers ([482dad0](https://github.com/MaximSrour/is-it-ready/commit/482dad008b949c8ad009a132db5877d2a8211bae))

# [1.1.0](https://github.com/MaximSrour/is-it-ready/compare/v1.0.2...v1.1.0) (2025-12-07)


### Bug Fixes

* add permissions section for CI workflow ([6be1851](https://github.com/MaximSrour/is-it-ready/commit/6be1851060b68c6acbfb0c4b254e5922b96681ee))
* ensure secrets are inherited in release job of CI workflow ([96fa278](https://github.com/MaximSrour/is-it-ready/commit/96fa278ee16005266b58daa2cc7fa4323c2aff2a))
* restructure CI workflow and remove redundant validation jobs ([fca856b](https://github.com/MaximSrour/is-it-ready/commit/fca856baa26d4e2033f8a2faed04625184adf6bc))
* update permissions for validate job in release workflow ([77fa6e6](https://github.com/MaximSrour/is-it-ready/commit/77fa6e619e5edc0100aa2fb518ca2727ab9156f3))


### Features

* add CI workflows for master branch and pull requests ([ded5d74](https://github.com/MaximSrour/is-it-ready/commit/ded5d746099206b2f554428a058cab7919769e7f))

## [1.0.2](https://github.com/MaximSrour/is-it-ready/compare/v1.0.1...v1.0.2) (2025-12-07)


### Bug Fixes

* resolve incorrect package root dir ([e028fde](https://github.com/MaximSrour/is-it-ready/commit/e028fdee98aafb55972196417e17e80f5a99cc47))

## [1.0.1](https://github.com/MaximSrour/is-it-ready/compare/v1.0.0...v1.0.1) (2025-12-07)


### Bug Fixes

* add silent mode option to suppress detailed failure messages ([004d86c](https://github.com/MaximSrour/is-it-ready/commit/004d86c6b8ee8f51d50a8f8f098e849bc70bddb5))
* Merge pull request [#5](https://github.com/MaximSrour/is-it-ready/issues/5) from MaximSrour/enhance-printing ([a2e6cb9](https://github.com/MaximSrour/is-it-ready/commit/a2e6cb988b8c7ae5db6421cf3682399d0319e61f))
* updated the header information ([701cd83](https://github.com/MaximSrour/is-it-ready/commit/701cd835ee99ce5796dee012a51e7a519e715eb3))

# 1.0.0 (2025-12-07)


### Bug Fixes

* Merge pull request [#3](https://github.com/MaximSrour/is-it-ready/issues/3) from MaximSrour/create-automated-release-process ([bbf8d17](https://github.com/MaximSrour/is-it-ready/commit/bbf8d17d4aa9d6ca3fb08aca32aaaaa1854446b8))
* Merge pull request [#4](https://github.com/MaximSrour/is-it-ready/issues/4) from MaximSrour/update-node-version-in-ci ([4e771de](https://github.com/MaximSrour/is-it-ready/commit/4e771de47c6e8eb7c8cad74a1748430e358ba8d0))
* resolve lint and knip errors ([eaf64ab](https://github.com/MaximSrour/is-it-ready/commit/eaf64abfb6bfbaf7c1e3aaa1e6f91b618a33fe4d))
* resolving lint and type errors ([0d6dc5e](https://github.com/MaximSrour/is-it-ready/commit/0d6dc5e2ae55238da4b6c5b0fe557273d23dea66))
* run prettier over added file ([071ba7c](https://github.com/MaximSrour/is-it-ready/commit/071ba7cda81cdfa5dc9b3c1c68bea248b7271570))
* update node version in CI ([80f7530](https://github.com/MaximSrour/is-it-ready/commit/80f75305e0996829fd3be3e0ca5065706e969e9d))


### Features

* add chalk dependency and enhance output formatting with color support ([e6c303c](https://github.com/MaximSrour/is-it-ready/commit/e6c303c4d141e25dd63c5fa030051c3fae3f2395))
* add source code ([5f22f58](https://github.com/MaximSrour/is-it-ready/commit/5f22f58c9cc6d6f392eac04c613558544b40413e))
