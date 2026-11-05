#!/usr/bin/env bash
# Usage: ci/build-apk.sh <project-dir> <output.apk> [versionCode]
set -euo pipefail
DIR="$1"; OUT="$2"; VC="${3:-1}"
cd "$DIR"
npm ci --no-audit --no-fund
VITE_MEDIA_BASE=https://sohel-mohiddin-learn-islam.github.io/learn-islam-app/ npx vite build --config vite.config.ts --base=/
rm -f dist/*.mp4
npx cap sync android
cd android
sed -i '/org.gradle.java.home/d' gradle.properties
sed -i 's#gradle-8.0.2-all.zip#gradle-8.14.3-all.zip#' gradle/wrapper/gradle-wrapper.properties
sed -i "s#com.android.tools.build:gradle:8.0.0#com.android.tools.build:gradle:8.13.0#; s#google-services:4.3.15#google-services:4.4.4#" build.gradle
sed -i "s#minSdkVersion = 22#minSdkVersion = 24#; s#compileSdkVersion = 33#compileSdkVersion = 36#; s#targetSdkVersion = 33#targetSdkVersion = 36#; s#androidxActivityVersion = '1.7.0'#androidxActivityVersion = '1.11.0'#; s#androidxAppCompatVersion = '1.6.1'#androidxAppCompatVersion = '1.7.1'#; s#androidxCoordinatorLayoutVersion = '1.2.0'#androidxCoordinatorLayoutVersion = '1.3.0'#; s#androidxCoreVersion = '1.10.0'#androidxCoreVersion = '1.17.0'#; s#androidxFragmentVersion = '1.5.6'#androidxFragmentVersion = '1.8.9'#; s#coreSplashScreenVersion = '1.0.0'#coreSplashScreenVersion = '1.2.0'#; s#androidxWebkitVersion = '1.6.1'#androidxWebkitVersion = '1.14.0'#" variables.gradle
sed -i "s/versionCode 1$/versionCode $VC/" app/build.gradle
mkdir -p ~/.android
cp ci-debug.keystore ~/.android/debug.keystore
chmod +x gradlew
./gradlew assembleDebug --no-daemon
cp "$(find app/build/outputs/apk/debug -name '*.apk' | head -1)" "$OUT"
