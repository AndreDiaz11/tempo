package com.local.tempo

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class TempoNotificationRestartReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        TempoNotificationService.restore(context)
    }
}
