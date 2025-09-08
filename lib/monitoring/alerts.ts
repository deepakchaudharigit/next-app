/**
 * Alerting System
 * Handles notifications for system issues, performance problems, and security events
 */

export interface Alert {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: Date
  source: string
  tags: Record<string, string>
  resolved: boolean
  resolvedAt?: Date
}

export interface AlertRule {
  id: string
  name: string
  condition: (metrics: any) => boolean
  severity: Alert['severity']
  message: string
  cooldown: number // minutes
  enabled: boolean
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'console'
  config: Record<string, any>
  enabled: boolean
}

class AlertManager {
  private alerts: Alert[] = []
  private rules: AlertRule[] = []
  private channels: NotificationChannel[] = []
  private lastAlertTimes = new Map<string, Date>()

  constructor() {
    this.initializeDefaultRules()
    this.initializeDefaultChannels()
  }

  // Add alert rule
  addRule(rule: AlertRule) {
    this.rules.push(rule)
  }

  // Add notification channel
  addChannel(channel: NotificationChannel) {
    this.channels.push(channel)
  }

  // Check all rules against current metrics
  async checkRules(metrics: any) {
    for (const rule of this.rules) {
      if (!rule.enabled) continue

      try {
        if (rule.condition(metrics)) {
          await this.triggerAlert(rule, metrics)
        }
      } catch (error) {
        console.error(`Error checking rule ${rule.name}:`, error)
      }
    }
  }

  // Trigger an alert
  private async triggerAlert(rule: AlertRule, metrics: any) {
    // Check cooldown
    const lastAlert = this.lastAlertTimes.get(rule.id)
    if (lastAlert) {
      const cooldownMs = rule.cooldown * 60 * 1000
      if (Date.now() - lastAlert.getTime() < cooldownMs) {
        return // Still in cooldown
      }
    }

    const alert: Alert = {
      id: this.generateAlertId(),
      severity: rule.severity,
      title: rule.name,
      message: this.interpolateMessage(rule.message, metrics),
      timestamp: new Date(),
      source: 'system',
      tags: { ruleId: rule.id },
      resolved: false
    }

    this.alerts.push(alert)
    this.lastAlertTimes.set(rule.id, new Date())

    // Send notifications
    await this.sendNotifications(alert)

    console.log(`🚨 Alert triggered: ${alert.title} - ${alert.message}`)
  }

  // Send notifications through all enabled channels
  private async sendNotifications(alert: Alert) {
    const enabledChannels = this.channels.filter(c => c.enabled)

    for (const channel of enabledChannels) {
      try {
        await this.sendNotification(channel, alert)
      } catch (error) {
        console.error(`Failed to send notification via ${channel.type}:`, error)
      }
    }
  }

  // Send notification through specific channel
  private async sendNotification(channel: NotificationChannel, alert: Alert) {
    switch (channel.type) {
      case 'email':
        await this.sendEmailNotification(channel.config, alert)
        break
      case 'slack':
        await this.sendSlackNotification(channel.config, alert)
        break
      case 'webhook':
        await this.sendWebhookNotification(channel.config, alert)
        break
      case 'console':
        this.sendConsoleNotification(alert)
        break
    }
  }

  // Email notification
  private async sendEmailNotification(config: any, alert: Alert) {
    const { sendEmail } = await import('@/lib/email')
    
    const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`
    const html = `
      <h2>Alert: ${alert.title}</h2>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p><strong>Time:</strong> ${alert.timestamp.toISOString()}</p>
      <p><strong>Message:</strong> ${alert.message}</p>
      <p><strong>Source:</strong> ${alert.source}</p>
      <p><strong>Tags:</strong> ${JSON.stringify(alert.tags)}</p>
    `

    await sendEmail({
      to: config.recipients,
      subject,
      html
    })
  }

  // Slack notification
  private async sendSlackNotification(config: any, alert: Alert) {
    const color = this.getSeverityColor(alert.severity)
    
    const payload = {
      text: `Alert: ${alert.title}`,
      attachments: [
        {
          color,
          fields: [
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Time', value: alert.timestamp.toISOString(), short: true },
            { title: 'Message', value: alert.message, short: false },
            { title: 'Source', value: alert.source, short: true }
          ]
        }
      ]
    }

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`)
    }
  }

  // Webhook notification
  private async sendWebhookNotification(config: any, alert: Alert) {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(alert)
    })

    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.statusText}`)
    }
  }

  // Console notification
  private sendConsoleNotification(alert: Alert) {
    const emoji = this.getSeverityEmoji(alert.severity)
    console.log(`${emoji} [${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}`)
  }

  // Resolve alert
  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert && !alert.resolved) {
      alert.resolved = true
      alert.resolvedAt = new Date()
      console.log(`✅ Alert resolved: ${alert.title}`)
    }
  }

  // Get active alerts
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved)
  }

  // Get all alerts
  getAllAlerts(limit = 100): Alert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  // Initialize default alert rules
  private initializeDefaultRules() {
    this.rules = [
      {
        id: 'high-response-time',
        name: 'High Response Time',
        condition: (metrics) => metrics.averageResponseTime > 2000,
        severity: 'medium',
        message: 'Average response time is {{averageResponseTime}}ms',
        cooldown: 5,
        enabled: true
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: (metrics) => metrics.errorRate > 0.05,
        severity: 'high',
        message: 'Error rate is {{errorRate}}%',
        cooldown: 5,
        enabled: true
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        condition: (metrics) => metrics.memory?.percentage > 90,
        severity: 'high',
        message: 'Memory usage is {{memory.percentage}}%',
        cooldown: 10,
        enabled: true
      },
      {
        id: 'database-connection-error',
        name: 'Database Connection Error',
        condition: (metrics) => metrics.database?.status === 'error',
        severity: 'critical',
        message: 'Database connection failed',
        cooldown: 1,
        enabled: true
      },
      {
        id: 'redis-connection-error',
        name: 'Redis Connection Error',
        condition: (metrics) => metrics.redis?.status === 'error',
        severity: 'medium',
        message: 'Redis connection failed',
        cooldown: 5,
        enabled: true
      },
      {
        id: 'slow-database-queries',
        name: 'Slow Database Queries',
        condition: (metrics) => metrics.database?.responseTime > 1000,
        severity: 'medium',
        message: 'Database response time is {{database.responseTime}}ms',
        cooldown: 10,
        enabled: true
      }
    ]
  }

  // Initialize default notification channels
  private initializeDefaultChannels() {
    this.channels = [
      {
        type: 'console',
        config: {},
        enabled: true
      }
    ]

    // Add email channel if configured
    if (process.env.EMAIL_HOST && process.env.ALERT_EMAIL_RECIPIENTS) {
      this.channels.push({
        type: 'email',
        config: {
          recipients: process.env.ALERT_EMAIL_RECIPIENTS.split(',')
        },
        enabled: true
      })
    }

    // Add Slack channel if configured
    if (process.env.SLACK_WEBHOOK_URL) {
      this.channels.push({
        type: 'slack',
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL
        },
        enabled: true
      })
    }
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private interpolateMessage(template: string, data: any): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path)
      return value !== undefined ? String(value) : match
    })
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private getSeverityColor(severity: Alert['severity']): string {
    switch (severity) {
      case 'low': return 'good'
      case 'medium': return 'warning'
      case 'high': return 'danger'
      case 'critical': return '#ff0000'
      default: return '#cccccc'
    }
  }

  private getSeverityEmoji(severity: Alert['severity']): string {
    switch (severity) {
      case 'low': return 'ℹ️'
      case 'medium': return '⚠️'
      case 'high': return '🚨'
      case 'critical': return '🔥'
      default: return '📢'
    }
  }
}

// Global alert manager instance
export const alertManager = new AlertManager()

// Security alert helpers
export function alertSecurityEvent(event: {
  type: 'failed_login' | 'suspicious_activity' | 'unauthorized_access' | 'data_breach'
  userId?: string
  ipAddress?: string
  userAgent?: string
  details: string
}) {
  const alert: Alert = {
    id: `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    severity: event.type === 'data_breach' ? 'critical' : 'high',
    title: `Security Event: ${event.type.replace('_', ' ').toUpperCase()}`,
    message: event.details,
    timestamp: new Date(),
    source: 'security',
    tags: {
      type: event.type,
      userId: event.userId || 'unknown',
      ipAddress: event.ipAddress || 'unknown'
    },
    resolved: false
  }

  alertManager['alerts'].push(alert)
  alertManager['sendNotifications'](alert)
}

// Business logic alert helpers
export function alertBusinessEvent(event: {
  type: 'power_outage' | 'equipment_failure' | 'maintenance_overdue' | 'capacity_exceeded'
  severity: Alert['severity']
  details: string
  equipmentId?: string
  location?: string
}) {
  const alert: Alert = {
    id: `business_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    severity: event.severity,
    title: `Business Alert: ${event.type.replace('_', ' ').toUpperCase()}`,
    message: event.details,
    timestamp: new Date(),
    source: 'business',
    tags: {
      type: event.type,
      equipmentId: event.equipmentId || 'unknown',
      location: event.location || 'unknown'
    },
    resolved: false
  }

  alertManager['alerts'].push(alert)
  alertManager['sendNotifications'](alert)
}