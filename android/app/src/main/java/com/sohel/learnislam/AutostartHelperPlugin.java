package com.sohel.learnislam;

import android.content.ComponentName;
import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AutostartHelper")
public class AutostartHelperPlugin extends Plugin {

    @PluginMethod
    public void openAutostartSettings(PluginCall call) {
        boolean opened = tryIntent("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity");
        if (!opened) {
            opened = tryIntent("com.miui.securitycenter", "com.miui.powercenter.PowerSettings");
        }
        if (!opened) {
            try {
                Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                opened = true;
            } catch (Exception e) {
            }
        }
        JSObject ret = new JSObject();
        ret.put("opened", opened);
        call.resolve(ret);
    }

    private boolean tryIntent(String packageName, String className) {
        try {
            Intent intent = new Intent();
            intent.setComponent(new ComponentName(packageName, className));
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
