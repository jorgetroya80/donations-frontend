# Changelog

## [0.3.8](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.3.7...donations-frontend-v0.3.8) (2026-08-05)


### Bug Fixes

* **deps:** patch all 16 open Dependabot advisories ([#175](https://github.com/jorgetroya80/donations-frontend/issues/175)) ([d0c55cf](https://github.com/jorgetroya80/donations-frontend/commit/d0c55cf0e6e50a8ee18dde6711e3d43e0dbee7f9))

## [0.3.7](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.3.6...donations-frontend-v0.3.7) (2026-08-01)


### Features

* **dashboard:** eliminate measured layout shifts and redundant refetches ([#173](https://github.com/jorgetroya80/donations-frontend/issues/173)) ([60a3de5](https://github.com/jorgetroya80/donations-frontend/commit/60a3de504e5fdb5a17696e8ddabc7b3290d49437))

## [0.3.6](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.3.5...donations-frontend-v0.3.6) (2026-07-27)


### Bug Fixes

* **calendar:** attach day button ref so keyboard navigation moves focus ([#169](https://github.com/jorgetroya80/donations-frontend/issues/169)) ([cde0184](https://github.com/jorgetroya80/donations-frontend/commit/cde01844eee255220a76733de5b9afcce115981f)), closes [#166](https://github.com/jorgetroya80/donations-frontend/issues/166)

## [0.3.5](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.3.4...donations-frontend-v0.3.5) (2026-07-27)


### Features

* split recharts off the dashboard render path and enable React Compiler ([#167](https://github.com/jorgetroya80/donations-frontend/issues/167)) ([f8464c0](https://github.com/jorgetroya80/donations-frontend/commit/f8464c056f90e0e55f8769bdc3a10598cc4e5f36))

## [0.3.4](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.3.3...donations-frontend-v0.3.4) (2026-07-25)


### Features

* **donors:** add per-donor statement link to the reports donor-statement tab ([#164](https://github.com/jorgetroya80/donations-frontend/issues/164)) ([16ef7b5](https://github.com/jorgetroya80/donations-frontend/commit/16ef7b588938b57c50306666463ba498ae68f49e))

## [0.3.3](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.3.2...donations-frontend-v0.3.3) (2026-07-20)


### Features

* persist list, sort, and report state in URL search params -  part 2 ([#160](https://github.com/jorgetroya80/donations-frontend/issues/160)) ([c714334](https://github.com/jorgetroya80/donations-frontend/commit/c7143342073b27fa712df31b452892520137f42f))

## [0.3.2](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.3.1...donations-frontend-v0.3.2) (2026-07-19)


### Features

* persist list, sort, and report state in URL search params ([#158](https://github.com/jorgetroya80/donations-frontend/issues/158)) ([bbb4225](https://github.com/jorgetroya80/donations-frontend/commit/bbb4225e276dfb8578235163a82c70d5fcfac724))

## [0.3.1](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.3.0...donations-frontend-v0.3.1) (2026-07-17)


### Features

* UI/UX refresh — prefill fix, toasts, ProblemDetail errors, mobile nav, a11y ([#156](https://github.com/jorgetroya80/donations-frontend/issues/156)) ([dc6ceae](https://github.com/jorgetroya80/donations-frontend/commit/dc6ceae83fa4e4b92f74a82bec2e01fbddea1dd3))

## [0.3.0](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.30...donations-frontend-v0.3.0) (2026-07-16)


### ⚠ BREAKING CHANGES

* migrate error handling to RFC 9457 ProblemDetail (api-client 2.0.0) ([#154](https://github.com/jorgetroya80/donations-frontend/issues/154))

### Features

* migrate error handling to RFC 9457 ProblemDetail (api-client 2.0.0) ([#154](https://github.com/jorgetroya80/donations-frontend/issues/154)) ([5fab641](https://github.com/jorgetroya80/donations-frontend/commit/5fab641469a0a285b6fc298220d55ffef29554c6)), closes [#153](https://github.com/jorgetroya80/donations-frontend/issues/153)

## [0.2.30](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.29...donations-frontend-v0.2.30) (2026-07-16)


### Bug Fixes

* **deps:** bump undici to 7.28.0 to resolve CVE-2026-9697 ([#151](https://github.com/jorgetroya80/donations-frontend/issues/151)) ([fb8c59c](https://github.com/jorgetroya80/donations-frontend/commit/fb8c59ca265c87cb97fb25922925149007997f0d))

## [0.2.29](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.28...donations-frontend-v0.2.29) (2026-06-29)


### Bug Fixes

* **docker:** add BuildKit syntax directive for Render build secrets ([#149](https://github.com/jorgetroya80/donations-frontend/issues/149)) ([25b45d0](https://github.com/jorgetroya80/donations-frontend/commit/25b45d0e989dc6c3911a3179358ee731951910a1))

## [0.2.28](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.27...donations-frontend-v0.2.28) (2026-06-29)


### Features

* **deploy:** deploy frontend to Render (Docker web service, same-origin /api proxy) ([#147](https://github.com/jorgetroya80/donations-frontend/issues/147)) ([50b5454](https://github.com/jorgetroya80/donations-frontend/commit/50b5454c9d71e8d644102337d8a9d5bf72331125))

## [0.2.27](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.26...donations-frontend-v0.2.27) (2026-06-26)


### Features

* **reports:** use searchable DonorPicker in donor-statement tab ([#144](https://github.com/jorgetroya80/donations-frontend/issues/144)) ([6ef269c](https://github.com/jorgetroya80/donations-frontend/commit/6ef269ca410d4f2410e92d3e43cb0a5b48218b00))

## [0.2.26](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.25...donations-frontend-v0.2.26) (2026-06-22)


### Features

* **donors:** server-side searchable donor picker (combobox) ([#142](https://github.com/jorgetroya80/donations-frontend/issues/142)) ([7c230cb](https://github.com/jorgetroya80/donations-frontend/commit/7c230cb096c96075a82c1c891ca1940f35abac2f))

## [0.2.25](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.24...donations-frontend-v0.2.25) (2026-06-19)


### Features

* **donor-picker:** paginated donor picker with table dialog ([#140](https://github.com/jorgetroya80/donations-frontend/issues/140)) ([8413d64](https://github.com/jorgetroya80/donations-frontend/commit/8413d64f58c9737a2ef8f8315f980bcff68fca43))

## [0.2.24](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.23...donations-frontend-v0.2.24) (2026-06-18)


### Features

* enhance typography and UI components with improved text wrapping and styling ([#138](https://github.com/jorgetroya80/donations-frontend/issues/138)) ([b189df6](https://github.com/jorgetroya80/donations-frontend/commit/b189df6725abf2dcfb378e9a83e80b7980315eaf))

## [0.2.23](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.22...donations-frontend-v0.2.23) (2026-06-16)


### Features

* migrate to nested page paginated response shape ([#135](https://github.com/jorgetroya80/donations-frontend/issues/135)) ([20a0b9c](https://github.com/jorgetroya80/donations-frontend/commit/20a0b9cf066db53db1907de06c2e51c37b2b865b))

## [0.2.22](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.21...donations-frontend-v0.2.22) (2026-06-12)


### Features

* project review improvements (error boundaries, lazy routes, shared sort hook) ([#132](https://github.com/jorgetroya80/donations-frontend/issues/132)) ([5c2ca3f](https://github.com/jorgetroya80/donations-frontend/commit/5c2ca3ff4e901202f0ed6d02ad25c3581754b1c1))

## [0.2.21](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.20...donations-frontend-v0.2.21) (2026-06-12)


### Features

* **auth:** forced password rotation flow ([#130](https://github.com/jorgetroya80/donations-frontend/issues/130)) ([11f68c2](https://github.com/jorgetroya80/donations-frontend/commit/11f68c28bb1a1db19df6946a7f6e25daa6ac953c))

## [0.2.20](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.19...donations-frontend-v0.2.20) (2026-06-10)


### Features

* update react-router version ([#127](https://github.com/jorgetroya80/donations-frontend/issues/127)) ([63457e9](https://github.com/jorgetroya80/donations-frontend/commit/63457e960dc95fbdb0001b07c7f1c8231b6fd743))

## [0.2.19](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.18...donations-frontend-v0.2.19) (2026-05-27)


### Features

* change reports chart for donations ([#125](https://github.com/jorgetroya80/donations-frontend/issues/125)) ([d2a0934](https://github.com/jorgetroya80/donations-frontend/commit/d2a0934e5a3a7b5c6f0a475ec79c77c65fbd0b16))

## [0.2.18](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.17...donations-frontend-v0.2.18) (2026-05-27)


### Features

* **reports:** replace donor select with Autocomplete for large donor lists ([#123](https://github.com/jorgetroya80/donations-frontend/issues/123)) ([84408bf](https://github.com/jorgetroya80/donations-frontend/commit/84408bfa06288dcadcf26de60693197a7b2f9b2b))

## [0.2.17](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.16...donations-frontend-v0.2.17) (2026-05-26)


### Features

* update docker publish workflow ([#120](https://github.com/jorgetroya80/donations-frontend/issues/120)) ([487795d](https://github.com/jorgetroya80/donations-frontend/commit/487795d22efdb21939669b9df125f96e0473e629))

## [0.2.16](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.15...donations-frontend-v0.2.16) (2026-05-26)


### Features

* enhance Docker setup and update README ([#118](https://github.com/jorgetroya80/donations-frontend/issues/118)) ([a02aac7](https://github.com/jorgetroya80/donations-frontend/commit/a02aac7002ad37ddb19812bf039bb4cd0ee7317b))

## [0.2.15](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.14...donations-frontend-v0.2.15) (2026-05-26)


### Features

* migrate HTTP layer to generated OpenAPI client ([#116](https://github.com/jorgetroya80/donations-frontend/issues/116)) ([d089dfc](https://github.com/jorgetroya80/donations-frontend/commit/d089dfcd08058624aafa9d08173279319c634a49))

## [0.2.14](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.13...donations-frontend-v0.2.14) (2026-05-25)


### Features

* add architecture documentation ([#113](https://github.com/jorgetroya80/donations-frontend/issues/113)) ([3cdf979](https://github.com/jorgetroya80/donations-frontend/commit/3cdf9792a94917feebc89a285568b957872bfe0c))

## [0.2.13](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.12...donations-frontend-v0.2.13) (2026-05-22)


### Features

* display server validation errors inline in donor form ([#111](https://github.com/jorgetroya80/donations-frontend/issues/111)) ([2ad622d](https://github.com/jorgetroya80/donations-frontend/commit/2ad622dbf4dda28b8bf74a0e4030b1cae469995c))

## [0.2.12](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.11...donations-frontend-v0.2.12) (2026-05-20)


### Features

* cancel in-flight GET requests on route change ([#107](https://github.com/jorgetroya80/donations-frontend/issues/107)) ([90d02c3](https://github.com/jorgetroya80/donations-frontend/commit/90d02c380da3c6aa5a77b3504135bf10f1f5fba7))

## [0.2.11](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.10...donations-frontend-v0.2.11) (2026-05-20)


### Bug Fixes

* collapsed sidebar icons wrap instead of stacking in single column ([#103](https://github.com/jorgetroya80/donations-frontend/issues/103)) ([f2b3d7f](https://github.com/jorgetroya80/donations-frontend/commit/f2b3d7f22d801766f3e7cab3836f2e101ff1342c))

## [0.2.10](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.9...donations-frontend-v0.2.10) (2026-05-20)


### Features

* password visibility toggle on Input component ([#100](https://github.com/jorgetroya80/donations-frontend/issues/100)) ([9b63805](https://github.com/jorgetroya80/donations-frontend/commit/9b63805846c0efcaef7dae9bc47d3bb327798404))

## [0.2.9](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.8...donations-frontend-v0.2.9) (2026-05-12)


### Features

* **deps:** remove date-fns and @rolldown/plugin-babel ([#97](https://github.com/jorgetroya80/donations-frontend/issues/97)) ([b613b21](https://github.com/jorgetroya80/donations-frontend/commit/b613b211b88a95c98da25a85e9adb305884dd0fd))

## [0.2.8](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.7...donations-frontend-v0.2.8) (2026-05-08)


### Bug Fixes

* **docker:** add ARM64/multi-arch support ([#93](https://github.com/jorgetroya80/donations-frontend/issues/93)) ([dc33d7a](https://github.com/jorgetroya80/donations-frontend/commit/dc33d7aa3189de9f6c630f754860e74caeaecc46))

## [0.2.7](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.6...donations-frontend-v0.2.7) (2026-05-07)


### Bug Fixes

* **docker:** add image tag to frontend service for end-user pull ([#90](https://github.com/jorgetroya80/donations-frontend/issues/90)) ([1bb8681](https://github.com/jorgetroya80/donations-frontend/commit/1bb868159ffd3ec6dd6d6dfd084cde8386a01bca))

## [0.2.6](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.5...donations-frontend-v0.2.6) (2026-05-07)


### Features

* add end-user setup scripts and update README ([#87](https://github.com/jorgetroya80/donations-frontend/issues/87)) ([8786136](https://github.com/jorgetroya80/donations-frontend/commit/878613617707598c6758d69d619fd5cd4428b14d))

## [0.2.5](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.4...donations-frontend-v0.2.5) (2026-05-07)


### Features

* **docker:** add postgres and wire full local prod stack ([#84](https://github.com/jorgetroya80/donations-frontend/issues/84)) ([2b90ff9](https://github.com/jorgetroya80/donations-frontend/commit/2b90ff929e076fc34ddab5c33a7062797fdb0267))

## [0.2.4](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.3...donations-frontend-v0.2.4) (2026-05-07)


### Features

* add dark mode with system preference detection ([#80](https://github.com/jorgetroya80/donations-frontend/issues/80)) ([0b8ded4](https://github.com/jorgetroya80/donations-frontend/commit/0b8ded4e0f697f69682d32ac0aed23dd6bb4ec97))

## [0.2.3](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.2...donations-frontend-v0.2.3) (2026-04-30)


### Features

* update README and docker-compose for full-stack local setup ([#77](https://github.com/jorgetroya80/donations-frontend/issues/77)) ([5503137](https://github.com/jorgetroya80/donations-frontend/commit/550313761e778035e41b945b5ebe5347e19fc489))

## [0.2.2](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.1...donations-frontend-v0.2.2) (2026-04-30)


### Features

* enhance Docker configuration and publish workflow ([#74](https://github.com/jorgetroya80/donations-frontend/issues/74)) ([43bfd07](https://github.com/jorgetroya80/donations-frontend/commit/43bfd0700486d757bf6b8284a43869c8deb02793))

## [0.2.1](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.2.0...donations-frontend-v0.2.1) (2026-04-30)


### Bug Fixes

* **release:** ensure GitHub pull request is skipped during release process ([#67](https://github.com/jorgetroya80/donations-frontend/issues/67)) ([1ec5e74](https://github.com/jorgetroya80/donations-frontend/commit/1ec5e74d54b263156cec369fb792abbacce35293))
* **release:** remove unnecessary release configuration files and skip GitHub pull request setting ([#68](https://github.com/jorgetroya80/donations-frontend/issues/68)) ([4023444](https://github.com/jorgetroya80/donations-frontend/commit/4023444a548e562c78b187a3ee3864df381043d2))
* **release:** restore manifest file ([#69](https://github.com/jorgetroya80/donations-frontend/issues/69)) ([6e11c61](https://github.com/jorgetroya80/donations-frontend/commit/6e11c615aa618cf7a0419a54e725be987a7890ed))

## [0.2.0](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.20...donations-frontend-v0.2.0) (2026-04-30)


### Features

* **release:** add release configuration and update workflow for automated releases ([#65](https://github.com/jorgetroya80/donations-frontend/issues/65)) ([f9fbbbb](https://github.com/jorgetroya80/donations-frontend/commit/f9fbbbba2a63b8bb34afba8b54e1db3c42e2ae0e))

## [0.1.20](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.19...donations-frontend-v0.1.20) (2026-04-29)


### Bug Fixes

* **ci:** use workflow_run trigger so docker-publish fires after release-please ([#60](https://github.com/jorgetroya80/donations-frontend/issues/60)) ([0ef0885](https://github.com/jorgetroya80/donations-frontend/commit/0ef0885402242c0663789d3dc2c79d746cf49e61)), closes [#59](https://github.com/jorgetroya80/donations-frontend/issues/59)

## [0.1.19](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.18...donations-frontend-v0.1.19) (2026-04-29)


### Features

* **docker:** harden Dockerfile, add compose, improve CI publish ([#54](https://github.com/jorgetroya80/donations-frontend/issues/54)) ([effa7c6](https://github.com/jorgetroya80/donations-frontend/commit/effa7c67e9ba4a0a3a961285b82b49127eb43685))

## [0.1.18](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.17...donations-frontend-v0.1.18) (2026-04-29)


### Bug Fixes

* **pre-commit:** add typecheck command to pre-commit hook and enforce unused imports ([#51](https://github.com/jorgetroya80/donations-frontend/issues/51)) ([091215c](https://github.com/jorgetroya80/donations-frontend/commit/091215cbfb51f4c6d8624dd7d8e6377d7323e2ac))

## [0.1.17](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.16...donations-frontend-v0.1.17) (2026-04-29)


### Features

* **formatters:** implement currency formatting and current month range functions ([#47](https://github.com/jorgetroya80/donations-frontend/issues/47)) ([781e1ed](https://github.com/jorgetroya80/donations-frontend/commit/781e1ede389406cbdd97e9414c6d0f4a952f69e5))

## [0.1.16](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.15...donations-frontend-v0.1.16) (2026-04-29)


### Features

* **ux:** add page title to header bar (Phase 4) ([#45](https://github.com/jorgetroya80/donations-frontend/issues/45)) ([a091905](https://github.com/jorgetroya80/donations-frontend/commit/a091905a8c70dbee63d1b1675f00a4cc0b5b9ec3))

## [0.1.15](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.14...donations-frontend-v0.1.15) (2026-04-29)


### Features

* **ux:** add Cancel button to all forms and navigate immediately on save ([#43](https://github.com/jorgetroya80/donations-frontend/issues/43)) ([0b6d47a](https://github.com/jorgetroya80/donations-frontend/commit/0b6d47a630f2304a4a08dc56b77142b88baa4930))

## [0.1.14](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.13...donations-frontend-v0.1.14) (2026-04-29)


### Features

* **ui:** implement EmptyState and Skeleton components for improved loading and empty states ([#41](https://github.com/jorgetroya80/donations-frontend/issues/41)) ([b314ffb](https://github.com/jorgetroya80/donations-frontend/commit/b314ffbca5f999413e4a4b4bf7c2a10c8901d65c))

## [0.1.13](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.12...donations-frontend-v0.1.13) (2026-04-29)


### Features

* **ui:** enhance form components with full-width styling for better layout ([#39](https://github.com/jorgetroya80/donations-frontend/issues/39)) ([e7d8aa0](https://github.com/jorgetroya80/donations-frontend/commit/e7d8aa070a201acae0dc44d6e6d4ab3ed465e7ed))

## [0.1.12](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.11...donations-frontend-v0.1.12) (2026-04-29)


### Features

* **styles:** update chart color variables for improved accessibility ([#32](https://github.com/jorgetroya80/donations-frontend/issues/32)) ([4009ad0](https://github.com/jorgetroya80/donations-frontend/commit/4009ad0f8157b3ea014794f8147ad56009427b90))

## [0.1.11](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.10...donations-frontend-v0.1.11) (2026-04-29)


### Features

* **a11y:** enhance accessibility for ReportsPage and Sidebar components ([#29](https://github.com/jorgetroya80/donations-frontend/issues/29)) ([306230e](https://github.com/jorgetroya80/donations-frontend/commit/306230ea7dee13632ef7b577ec16fa5f8c92a553))

## [0.1.10](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.9...donations-frontend-v0.1.10) (2026-04-28)


### Features

* **a11y:** Phase 3 — list page edit links and sortable header keyboard support ([#27](https://github.com/jorgetroya80/donations-frontend/issues/27)) ([95ffc0a](https://github.com/jorgetroya80/donations-frontend/commit/95ffc0aeb663d14f2a6998f93eb07036e9be7dcd))

## [0.1.9](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.8...donations-frontend-v0.1.9) (2026-04-28)


### Features

* **a11y:** Phase 2 — form ARIA wiring across all five forms ([#25](https://github.com/jorgetroya80/donations-frontend/issues/25)) ([900a3ee](https://github.com/jorgetroya80/donations-frontend/commit/900a3ee6fc82cde4e5a0169efb3f205ec1ba95b1))

## [0.1.8](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.7...donations-frontend-v0.1.8) (2026-04-28)


### Features

* accessibility phase 1 - foundation fixes ([#23](https://github.com/jorgetroya80/donations-frontend/issues/23)) ([a344e3b](https://github.com/jorgetroya80/donations-frontend/commit/a344e3bdfbfec306b67170d2345cae752fc67555))

## [0.1.7](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.6...donations-frontend-v0.1.7) (2026-04-27)


### Features

* move settings to release config ([#17](https://github.com/jorgetroya80/donations-frontend/issues/17)) ([4fa2774](https://github.com/jorgetroya80/donations-frontend/commit/4fa2774a95cc83d7eb2dafe5cc2286e01af51c7a))
* update release-please manifest ([#15](https://github.com/jorgetroya80/donations-frontend/issues/15)) ([2ad78d7](https://github.com/jorgetroya80/donations-frontend/commit/2ad78d7e30c8edd035caf9170c097f17abcace08))


### Bug Fixes

* release-please unable to parse emoji ([#16](https://github.com/jorgetroya80/donations-frontend/issues/16)) ([95d5567](https://github.com/jorgetroya80/donations-frontend/commit/95d5567d5b1a80fad68c587d69387780f9804405))

## [0.1.6](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.5...donations-frontend-v0.1.6) (2026-04-27)


### Features

* update payment method translation, refactor header component and reorder Tailwind classes names  ([#13](https://github.com/jorgetroya80/donations-frontend/issues/13)) ([8228fd5](https://github.com/jorgetroya80/donations-frontend/commit/8228fd582919fe778bccde02ca39735a1a95cb52))

## [0.1.5](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.4...donations-frontend-v0.1.5) (2026-04-27)


### Bug Fixes

* update donation and expense forms for localized select values ([#11](https://github.com/jorgetroya80/donations-frontend/issues/11)) ([dbc3fa5](https://github.com/jorgetroya80/donations-frontend/commit/dbc3fa5316c877c282881ecf3bc4402cc499cae3))

## [0.1.4](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.3...donations-frontend-v0.1.4) (2026-04-24)


### Features

* role-based sidebar and route access ([#9](https://github.com/jorgetroya80/donations-frontend/issues/9)) ([671b6f8](https://github.com/jorgetroya80/donations-frontend/commit/671b6f8760b954d2c6de013ebbeedeb45d419923))

## [0.1.3](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.2...donations-frontend-v0.1.3) (2026-04-24)


### Features

* add readme and other things ([#5](https://github.com/jorgetroya80/donations-frontend/issues/5)) ([e4bc019](https://github.com/jorgetroya80/donations-frontend/commit/e4bc019d21aec55c20a2f9ad344c1cbb6a715b9b))

## [0.1.2](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.1...donations-frontend-v0.1.2) (2026-04-24)

### Bug Fixes

- removed markdown and YAML files from formatting ([42c7f8e](https://github.com/jorgetroya80/donations-frontend/commit/42c7f8ef60948286ea05df422049a86d136b6b36))

## [0.1.1](https://github.com/jorgetroya80/donations-frontend/compare/donations-frontend-v0.1.0...donations-frontend-v0.1.1) (2026-04-23)

### Features

- add CI/CD pipeline with GitHub Actions, release-please, and Docker ([a0961c2](https://github.com/jorgetroya80/donations-frontend/commit/a0961c2a4688af7231b134bb2943359de6c0c736))
- Phase 1 — foundation + auth ([fa7f601](https://github.com/jorgetroya80/donations-frontend/commit/fa7f601e13d4ab763c341e9d20b76380528ae085))
- Phase 2 — layout + navigation + i18n ([9e8a96d](https://github.com/jorgetroya80/donations-frontend/commit/9e8a96dd7edb6db7e08915dcea3ec2fd6c4a3f7c))
- Phase 3 — dashboard home with balance cards and charts ([2b7ebaa](https://github.com/jorgetroya80/donations-frontend/commit/2b7ebaaabd34cf9797fe5c5e4c7534b54bc8f606))
- Phase 3.5 — testing setup + backfill ([771d83b](https://github.com/jorgetroya80/donations-frontend/commit/771d83b23db50211f49372c40eaf32c215e2775c))
- Phase 4 — donations CRUD with paginated list, create, and edit ([577ea16](https://github.com/jorgetroya80/donations-frontend/commit/577ea16b00e4bc28cc6f29ab55c2afc382790d07))
- Phase 5 — donors CRUD with paginated list, create, and edit ([7e40232](https://github.com/jorgetroya80/donations-frontend/commit/7e40232f1749fd4e09b14920c2a6e4a0ac1ce5a5))
- Phase 6 — expenses CRUD with paginated list, create, and edit ([151041e](https://github.com/jorgetroya80/donations-frontend/commit/151041e869f0a92ab62ebc3868644d66c8c812a3))
- Phase 7 — admin-only users management with CRUD and route guard ([668379e](https://github.com/jorgetroya80/donations-frontend/commit/668379e0fab50e7fdfcec89a4f593c58e69ce7d7))
- Phase 8 — reports page with tabbed donation, expense, and donor statement views ([e57569c](https://github.com/jorgetroya80/donations-frontend/commit/e57569c17a1af0fb114e3d8aed4ab023fb630b63))
- Phase 9 — change password page with validation and error handling ([961f806](https://github.com/jorgetroya80/donations-frontend/commit/961f806a3d121479f6eaf705e663ba94b895e544))
- refactor forms to use Controller for better state management ([8f94b61](https://github.com/jorgetroya80/donations-frontend/commit/8f94b613c42e408b90dbb6d6e32af9656cf6ddef))
- role-based dashboard widgets ([a1d295d](https://github.com/jorgetroya80/donations-frontend/commit/a1d295d1336ad6aa2e372395c6049f970240fdbe))

### Bug Fixes

- login form submission and API connectivity ([640cf5a](https://github.com/jorgetroya80/donations-frontend/commit/640cf5af88287d1992ec2cca72e4ec304cdba5fd))
- replace button for span in date picker ([99234a2](https://github.com/jorgetroya80/donations-frontend/commit/99234a2f31f9951fa6539a0491b1e2ed9e5b5c2e))
