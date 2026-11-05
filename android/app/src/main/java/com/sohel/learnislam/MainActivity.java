package com.sohel.learnislam;

import android.content.SharedPreferences;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import java.io.File;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        clearStaleWebCachesAfterUpdate();
        super.onCreate(savedInstanceState);
    }

    /**
     * After the app is updated, throw away the web view's cached pages and service workers.
     * Old cached files point to scripts that no longer exist in the new version, which showed a blank white screen.
     * Logins and saved settings (local storage / IndexedDB) are kept.
     */
    private void clearStaleWebCachesAfterUpdate() {
        try {
            long updated = getPackageManager().getPackageInfo(getPackageName(), 0).lastUpdateTime;
            SharedPreferences prefs = getSharedPreferences("li_boot", MODE_PRIVATE);
            if (prefs.getLong("updated", 0) == updated) return;

            File data = new File(getApplicationInfo().dataDir, "app_webview");
            String[] dirs = {
                "Default/Service Worker",
                "Default/Cache",
                "Default/Code Cache",
                "Default/GPUCache",
                "Default/Application Cache",
                "Default/HTTP Cache"
            };
            for (String d : dirs) deleteRecursively(new File(data, d));
            deleteRecursively(new File(getCacheDir(), "WebView"));

            prefs.edit().putLong("updated", updated).apply();
        } catch (Exception ignored) {
            // never block the app from starting
        }
    }

    private static void deleteRecursively(File f) {
        if (f == null || !f.exists()) return;
        File[] children = f.listFiles();
        if (children != null) {
            for (File c : children) deleteRecursively(c);
        }
        //noinspection ResultOfMethodCallIgnored
        f.delete();
    }
}
