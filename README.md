# Windows Environment Check

Prepare the dependencies for the boot camp before class. This small project checks Java, Maven, Spring Boot, H2, React, TypeScript, OpenAPI and a real Chromium browser together. It contains no course exercises.

## Install the basic tools

1. Install **BellSoft JDK 21** from your company's Software Center. Set `JAVA_HOME` to the JDK folder and add its `bin` folder to PATH. Close and reopen your terminal after changing them.
2. Install **IntelliJ IDEA** using your company's approved method. Select the installed JDK 21 for the project, Maven importer and Maven runner when opening a Java project. Running and debugging a test in the IDE is a separate manual check.
3. Install **Git for Windows**, **Node.js 24 LTS** with its included npm, and an approved **Edge or Chrome** browser.

You do not need to install Maven or an H2 server separately. Spring Boot, JUnit, React and the other libraries are project dependencies, not applications to install globally.

## Download and run

Download `environment-check.zip` and `SHA256SUMS` from the [versioned Releases](https://github.com/afs-2026/environment-check/releases). Extract the ZIP to a local folder before running it. Use the same computer and Windows account that you will use in class.

1. Double-click **`prepare.cmd`**, or run `.\prepare.cmd` in PowerShell. Keep the internet connection available. The first run downloads dependencies and Chromium, builds the projects, checks H2, runs a headless Chromium check, and repeats the checks using Maven/npm offline modes.
2. Wait for **`PASS: Java tests, Spring Boot/H2, React build, OpenAPI and Chromium checks passed.`** A successful run returns exit code zero.
3. To check again later, run **`verify-offline.cmd`**. This rebuilds the projects and reinstalls npm dependencies from your existing cache.

Keep the Maven, npm and Playwright caches. Class projects using the same locked versions can reuse them. They may still need an installation command, but cached packages do not need another download. New or changed dependencies require a newer preparation package.

`verify-offline.cmd` verifies package-manager offline modes. It does not disable all networking on your computer. All application checks use only `127.0.0.1`.

## macOS and Linux

The checker itself is cross-platform; only the `.cmd` launchers are Windows-only. On macOS or Linux, run the script directly instead:

1. Install JDK 21 and Node.js 24 LTS, for example with asdf. This folder contains a `.tool-versions` file (`java corretto-21`, `nodejs 24.22.1`); any JDK 21 distribution works. Export `JAVA_HOME` to the JDK 21 folder in your shell.
2. Run `node scripts/readiness.mjs prepare`. It performs the same downloads, builds and checks as `prepare.cmd`, including the offline pass. To re-check later, run `node scripts/readiness.mjs offline`, matching `verify-offline.cmd`.

## What is checked

| Component | Locked version or check |
| --- | --- |
| Java | `java`, `javac`, and `JAVA_HOME` all use JDK 21 |
| Node.js | 24.x; npm is included |
| Maven | Wrapper 3.3.4 downloads Maven 3.9.16 and verifies SHA-256 |
| JUnit | BOM 6.0.3, with the same compiler/test plugins used by the Java exercises |
| Backend | Spring Boot 4.1.1, validation, JPA and H2; writes and reads a real database row |
| Frontend | React 19.3.1, TypeScript 7.0.2 and Vite 8.3.5; type-check and build |
| Browser | Playwright 1.64.1 and its matching Chromium; page load and reload |
| OpenAPI | Validates the included API document |

Full dependency versions are fixed in `pom.xml` and `frontend/package-lock.json`. The browser is downloaded separately from npm packages.

## If a check fails

Read the stage and error shown in the window. The full log is in **`.reports/`** inside the extracted folder. Share the error and log with the training team; no automatic upload takes place.

| Problem | Action |
| --- | --- |
| Java version or `JAVA_HOME` error | Select BellSoft JDK 21 from Software Center, check PATH, and reopen the terminal. `JAVA_HOME` must not end in `bin`. |
| Node version or npm missing | Install Node.js 24 LTS with npm and reopen the terminal. |
| Download or certificate error | Ask your IT team to check access to Maven Central, the npm registry and Playwright browser downloads under your company proxy and certificate policy. |
| Offline cache missing | Run `prepare.cmd` online using the same Windows account. |
| Port 18080 or 15173 occupied | Close the application using that port and retry. The checker does not stop unrelated programs. |

GitHub-hosted Windows checks verify these scripts and the ZIP. Your company network, software installation permissions and IntelliJ configuration still need the check on your own computer.

AI tools: use either **Qoder** or **Visual Studio Code with GitHub Copilot**.

## Maintainer checks and releases

Use Java 21 and Node.js 24. Run `node scripts/package.mjs` from a committed source tree to create the explicit-file-list ZIP and `SHA256SUMS`. The Maven Wrapper files are Apache Maven Wrapper 3.3.4 under the Apache License 2.0; their license notices remain in the scripts and JAR.

Relevant pull requests run Windows validation. Regular main pushes and schedules do not run the full check. A `v*` tag validates the ZIP with empty caches and then publishes the exact tested archive. Manual runs validate only. Never move a published tag or replace a released archive; publish a new version.

For CI only, `ENVIRONMENT_CHECK_CACHE_ROOT` selects isolated Maven Wrapper, Maven repository, npm and Playwright caches. Learners leave it unset so future exercises reuse their normal user caches.
