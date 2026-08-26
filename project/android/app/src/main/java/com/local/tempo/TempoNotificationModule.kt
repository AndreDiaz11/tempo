package com.local.tempo

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TempoNotificationModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "TempoNotification"

  @ReactMethod
  fun sync(paymentsJson: String, promise: Promise) {
    try {
      TempoNotificationService.sync(reactApplicationContext, paymentsJson)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("sync_error", e)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      TempoNotificationService.stop(reactApplicationContext)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("stop_error", e)
    }
  }

  @ReactMethod
  fun requestBatteryExemption(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        promise.resolve(true)
        return
      }
      val packageName = reactApplicationContext.packageName
      val powerManager = reactApplicationContext.getSystemService(PowerManager::class.java)
      val alreadyIgnoring = powerManager?.isIgnoringBatteryOptimizations(packageName) ?: true

      if (!alreadyIgnoring) {
        try {
          val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = Uri.parse("package:$packageName")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          reactApplicationContext.startActivity(intent)
        } catch (_: Exception) {
          val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.parse("package:$packageName")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          reactApplicationContext.startActivity(intent)
        }
      }
      promise.resolve(alreadyIgnoring)
    } catch (e: Exception) {
      promise.reject("battery_exemption_error", e)
    }
  }

  @ReactMethod
  fun openAppNotificationSettings(promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
        putExtra(Settings.EXTRA_APP_PACKAGE, reactApplicationContext.packageName)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      reactApplicationContext.startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("open_settings_error", e)
    }
  }
}
