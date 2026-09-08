package com.sohel.learnislam;

import android.view.View;
import android.webkit.WebView;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppReady")
public class AppReadyPlugin extends Plugin {

    @PluginMethod
    public void signalReady(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void forceRedraw(PluginCall call) {
        final WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.post(() -> {
                // Toggling the WebView's rendering layer type forces Android
                // to fully tear down and rebuild its hardware compositor
                // state. This is the standard fix for hardware-accelerated
                // WebViews getting "stuck" ignoring touches after an
                // external Activity (like a native OAuth screen) returns.
                webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
                webView.requestFocus();
                webView.postDelayed(() -> {
                    webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                    webView.invalidate();
                }, 100);
            });
        }
        call.resolve();
    }
}
