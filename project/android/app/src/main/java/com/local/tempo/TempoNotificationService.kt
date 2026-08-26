package com.local.tempo

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.PowerManager
import android.os.SystemClock
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import java.text.ParseException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import org.json.JSONArray
import org.json.JSONObject

/**
 * Notificacion fija de Tempo. A diferencia de la de Pulse, esta NO usa un
 * Foreground Service - programa alarmas exactas que van renovando/
 * refrescando una notificacion "ongoing" (FLAG_NO_CLEAR) cada cierto
 * tiempo, con un modo silencioso normal y uno sonoro/vibrante cuando el
 * pago esta cerca. Puerto fiel de la version Capacitor (TempoNotificationService.java).
 */
object TempoNotificationService {
    private const val PREFS = "tempo_status"
    private const val PREF_PAYMENTS = "payments"
    private const val ALERT_CHANNEL_ID = "tempo_payment_alert_v2"
    private const val QUIET_CHANNEL_ID = "tempo_payment_quiet_v2"
    private const val NOTIFICATION_ID = 3201
    private const val REFRESH_REQUEST_CODE = 3202
    private const val PREF_LAST_ALERT_AT = "last_alert_at"
    private const val PREF_LAST_ALERT_PAYMENT_ID = "last_alert_payment_id"
    private const val MINUTE = 60_000L
    private const val FIFTEEN_MINUTES = 15L * MINUTE
    private const val DAY = 86_400_000L
    private val VIBRATION_PATTERN = longArrayOf(0L, 450L, 160L, 450L)

    private data class TrackedPayment(
        var id: String = "",
        var title: String = "",
        var kind: String = "",
        var direction: String = "expense",
        var detail: String = "",
        var dueDate: String = "",
        var amount: Double = 0.0,
        var alertAt: Long = 0,
        var alertWindowEndAt: Long = 0,
        var repeatMinutes: Int = 60,
        var vibrate: Boolean = true,
        var wakeScreen: Boolean = true,
    )

    fun sync(context: Context, rawPayments: String?) {
        val appContext = context.applicationContext
        val safePayments = rawPayments ?: ""
        preferences(appContext).edit().putString(PREF_PAYMENTS, safePayments).commit()

        if (safePayments.isEmpty()) {
            stop(appContext)
            return
        }
        update(appContext)
    }

    fun stop(context: Context) {
        val appContext = context.applicationContext
        preferences(appContext).edit().remove(PREF_PAYMENTS).apply()
        cancelRefresh(appContext)
        val manager = appContext.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        manager?.cancel(NOTIFICATION_ID)
    }

    fun restore(context: Context) {
        val appContext = context.applicationContext
        if (preferences(appContext).getString(PREF_PAYMENTS, "").isNullOrEmpty()) return
        update(appContext)
    }

    private fun update(context: Context) {
        val payments = parsePayments(preferences(context).getString(PREF_PAYMENTS, ""))
        val payment = choosePayment(payments) ?: run {
            stop(context)
            return
        }

        val noisy = shouldNotifyNow(context, payment)
        createChannel(context, channelId(payment, noisy), noisy && payment.vibrate)
        if (noisy && payment.wakeScreen) wakeScreen(context)

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        manager?.notify(NOTIFICATION_ID, buildNotification(context, payment, noisy))
        scheduleNextRefresh(context, payment)
    }

    private fun parsePayments(raw: String?): List<TrackedPayment> {
        val payments = mutableListOf<TrackedPayment>()
        if (raw.isNullOrEmpty()) return payments
        try {
            val array = JSONArray(raw)
            for (i in 0 until array.length()) {
                val item = array.getJSONObject(i)
                payments.add(
                    TrackedPayment(
                        id = item.optString("id"),
                        title = item.optString("title"),
                        kind = item.optString("kind"),
                        direction = item.optString("direction", "expense"),
                        detail = item.optString("detail"),
                        dueDate = item.optString("dueDate"),
                        amount = item.optDouble("amount"),
                        alertAt = item.optLong("alertAt"),
                        alertWindowEndAt = item.optLong("alertWindowEndAt", item.optLong("alertAt") + DAY),
                        repeatMinutes = maxOf(5, item.optInt("repeatMinutes", 60)),
                        vibrate = item.optBoolean("vibrate", true),
                        wakeScreen = item.optBoolean("wakeScreen", true),
                    ),
                )
            }
        } catch (_: Exception) {
        }
        return payments
    }

    private fun choosePayment(payments: List<TrackedPayment>): TrackedPayment? {
        val now = System.currentTimeMillis()
        var next: TrackedPayment? = null
        for (payment in payments) {
            if (payment.alertWindowEndAt >= now && (next == null || payment.alertAt < next.alertAt)) next = payment
        }
        return next
    }

    private fun buildNotification(context: Context, payment: TrackedPayment, noisy: Boolean): Notification {
        val title = payment.title.ifEmpty { "Próximo pago" }
        val amount = (if (payment.direction == "income") "+ " else "- ") + "S/ " +
            String.format(Locale.US, "%.2f", payment.amount)
        val due = (if (payment.direction == "income") "Recibes el " else "Cobra el ") + formatDueDate(payment.dueDate)
        val shortDue = (if (payment.direction == "income") "Prox. Ingreso: " else "Prox. Pago: ") +
            formatShortDueDate(payment.dueDate)
        val countdown = countdownText(payment)
        val detail = payment.detail.ifEmpty { payment.kind }
        val status = if (isInsideAlertWindow(payment)) "Pago cercano" else "Próxima alerta"

        val openIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentIntent = PendingIntent.getActivity(
            context,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val collapsedView = RemoteViews(context.packageName, R.layout.notification_payment_collapsed).apply {
            setTextViewText(R.id.notification_title, shortDue)
            setTextViewText(R.id.notification_date, title)
        }

        val expandedView = RemoteViews(context.packageName, R.layout.notification_payment).apply {
            setTextViewText(R.id.notification_title, shortDue)
            setTextViewText(R.id.notification_date, due)
            setTextViewText(R.id.notification_countdown, countdown)
            setTextViewText(R.id.notification_detail, "$status • $detail")
            setTextViewText(R.id.notification_amount, amount)
        }

        val channelId = channelId(payment, noisy)
        val publicNotification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_payment_notification)
            .setColor(0xFF64748B.toInt())
            .setContentTitle(shortDue)
            .setContentText(title)
            .setOngoing(true)
            .setAutoCancel(false)
            .setOnlyAlertOnce(!noisy)
            .setSilent(!noisy)
            .setShowWhen(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(if (noisy) NotificationCompat.PRIORITY_HIGH else NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .build()
        publicNotification.flags = publicNotification.flags or Notification.FLAG_NO_CLEAR or Notification.FLAG_ONGOING_EVENT

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_payment_notification)
            .setColor(0xFF64748B.toInt())
            .setContentTitle(shortDue)
            .setContentText(title)
            .setCustomContentView(collapsedView)
            .setCustomBigContentView(expandedView)
            .setStyle(NotificationCompat.DecoratedCustomViewStyle())
            .setContentIntent(contentIntent)
            .setOngoing(true)
            .setAutoCancel(false)
            .setOnlyAlertOnce(!noisy)
            .setSilent(!noisy)
            .setLocalOnly(true)
            .setShowWhen(false)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(if (noisy) NotificationCompat.PRIORITY_HIGH else NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setPublicVersion(publicNotification)

        if (noisy && payment.vibrate) {
            builder.setVibrate(VIBRATION_PATTERN).setDefaults(NotificationCompat.DEFAULT_VIBRATE)
        }

        val notification = builder.build()
        notification.flags = notification.flags or Notification.FLAG_NO_CLEAR or Notification.FLAG_ONGOING_EVENT
        return notification
    }

    private fun isInsideAlertWindow(payment: TrackedPayment): Boolean {
        val now = System.currentTimeMillis()
        return now in payment.alertAt..payment.alertWindowEndAt
    }

    private fun countdownText(payment: TrackedPayment): String {
        val now = System.currentTimeMillis()
        val target = if (now < payment.alertAt) payment.alertAt else payment.alertWindowEndAt
        val total = maxOf(0L, target - now)
        val days = total / DAY
        val hours = (total % DAY) / 3_600_000L
        val minutes = (total % 3_600_000L) / MINUTE

        return if (now < payment.alertAt) {
            when {
                days == 0L && hours == 0L -> "Avisa en $minutes min"
                days == 0L -> "Avisa en $hours h $minutes min"
                else -> "Avisa en $days dias, $hours h"
            }
        } else {
            when {
                days == 0L && hours == 0L -> "Vence en $minutes min"
                days == 0L -> "Vence en $hours h $minutes min"
                else -> "Faltan $days días, $hours h"
            }
        }
    }

    private fun formatDueDate(rawDate: String): String {
        if (rawDate.isEmpty()) return ""
        return try {
            val source = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val parsed: Date = source.parse(rawDate) ?: return rawDate
            SimpleDateFormat("dd MMM yyyy", Locale("es", "PE")).format(parsed).replace(".", "")
        } catch (_: ParseException) {
            rawDate
        }
    }

    private fun formatShortDueDate(rawDate: String): String {
        if (rawDate.isEmpty()) return ""
        return try {
            val source = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val parsed: Date = source.parse(rawDate) ?: return rawDate
            SimpleDateFormat("d MMM", Locale("es", "PE")).format(parsed).replace(".", "")
        } catch (_: ParseException) {
            rawDate
        }
    }

    private fun shouldNotifyNow(context: Context, payment: TrackedPayment): Boolean {
        if (!isInsideAlertWindow(payment)) return false

        val preferences = preferences(context)
        val now = System.currentTimeMillis()
        val lastAlertAt = preferences.getLong(PREF_LAST_ALERT_AT, 0L)
        val lastPaymentId = preferences.getString(PREF_LAST_ALERT_PAYMENT_ID, "")
        val repeatMs = maxOf(5, payment.repeatMinutes) * MINUTE
        val shouldNotify = payment.id != lastPaymentId || now - lastAlertAt >= repeatMs

        if (shouldNotify) {
            preferences.edit()
                .putLong(PREF_LAST_ALERT_AT, now)
                .putString(PREF_LAST_ALERT_PAYMENT_ID, payment.id)
                .apply()
        }
        return shouldNotify
    }

    private fun wakeScreen(context: Context) {
        try {
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return
            val wakeLock = powerManager.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP or PowerManager.ON_AFTER_RELEASE,
                "Tempo:PaymentAlert",
            )
            wakeLock.acquire(5000L)
        } catch (_: Exception) {
        }
    }

    private fun channelId(payment: TrackedPayment, noisy: Boolean): String =
        if (noisy && payment.vibrate) ALERT_CHANNEL_ID else QUIET_CHANNEL_ID

    private fun scheduleNextRefresh(context: Context, payment: TrackedPayment) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val refreshIntent = Intent(context, TempoNotificationRestartReceiver::class.java).apply {
            setPackage(context.packageName)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            REFRESH_REQUEST_CODE,
            refreshIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val delay = nextTickDelay(payment)
        val refreshAt = SystemClock.elapsedRealtime() + delay
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, refreshAt, pendingIntent)
            } else {
                alarmManager.setExact(AlarmManager.ELAPSED_REALTIME_WAKEUP, refreshAt, pendingIntent)
            }
        } catch (_: SecurityException) {
            alarmManager.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, refreshAt, pendingIntent)
        }
    }

    private fun cancelRefresh(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val refreshIntent = Intent(context, TempoNotificationRestartReceiver::class.java).apply {
            setPackage(context.packageName)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            REFRESH_REQUEST_CODE,
            refreshIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        alarmManager.cancel(pendingIntent)
    }

    private fun nextTickDelay(payment: TrackedPayment): Long {
        val now = System.currentTimeMillis()
        if (now < payment.alertAt) {
            val untilAlert = payment.alertAt - now
            return maxOf(MINUTE, minOf(FIFTEEN_MINUTES, untilAlert))
        }
        if (now <= payment.alertWindowEndAt) {
            return maxOf(5, payment.repeatMinutes) * MINUTE
        }
        return FIFTEEN_MINUTES
    }

    private fun preferences(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun createChannel(context: Context, channelId: String, vibrate: Boolean) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            channelId,
            if (vibrate) "Tempo alertas de pago" else "Tempo siempre activo",
            if (vibrate) NotificationManager.IMPORTANCE_HIGH else NotificationManager.IMPORTANCE_DEFAULT,
        ).apply {
            description = "Notificación fija del próximo pago"
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            setSound(null, null)
            enableVibration(vibrate)
            if (vibrate) vibrationPattern = VIBRATION_PATTERN
            enableLights(false)
            setShowBadge(false)
        }
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        manager?.createNotificationChannel(channel)
    }
}
