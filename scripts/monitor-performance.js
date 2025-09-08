#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * Continuously monitors application performance and alerts on issues
 */

const fetch = require('node-fetch');

class PerformanceMonitor {
  constructor() {
    this.baseUrl = process.env.MONITOR_URL || 'http://localhost:3000';
    this.interval = parseInt(process.env.MONITOR_INTERVAL || '30000'); // 30 seconds
    this.alertThresholds = {
      responseTime: parseInt(process.env.ALERT_RESPONSE_TIME || '2000'),
      errorRate: parseFloat(process.env.ALERT_ERROR_RATE || '0.05'),
      memoryUsage: parseFloat(process.env.ALERT_MEMORY_USAGE || '0.9')
    };
    this.isRunning = false;
  }

  async start() {
    console.log('🔍 Starting performance monitoring...');
    console.log(`📊 Monitoring ${this.baseUrl} every ${this.interval}ms`);
    console.log(`⚠️ Alert thresholds:`, this.alertThresholds);
    
    this.isRunning = true;
    
    while (this.isRunning) {
      try {
        await this.checkHealth();
        await this.sleep(this.interval);
      } catch (error) {
        console.error('❌ Monitoring error:', error.message);
        await this.sleep(5000); // Wait 5 seconds on error
      }
    }
  }

  async checkHealth() {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/health/detailed`, {
        timeout: 10000
      });
      
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      this.analyzeHealth(data, responseTime);
      
    } catch (error) {
      console.error(`🚨 Health check failed: ${error.message}`);
      this.sendAlert('critical', 'Health Check Failed', error.message);
    }
  }

  analyzeHealth(health, responseTime) {
    const timestamp = new Date().toISOString();
    
    // Log current status
    console.log(`[${timestamp}] Status: ${health.status} | Response: ${responseTime}ms | Memory: ${health.system?.memory?.percentage?.toFixed(1)}%`);
    
    // Check response time
    if (responseTime > this.alertThresholds.responseTime) {
      this.sendAlert('high', 'Slow Response Time', `Health check took ${responseTime}ms`);
    }
    
    // Check error rate
    if (health.performance?.errorRate > this.alertThresholds.errorRate) {
      this.sendAlert('high', 'High Error Rate', `Error rate: ${(health.performance.errorRate * 100).toFixed(2)}%`);
    }
    
    // Check memory usage
    if (health.system?.memory?.percentage > this.alertThresholds.memoryUsage * 100) {
      this.sendAlert('medium', 'High Memory Usage', `Memory usage: ${health.system.memory.percentage.toFixed(1)}%`);
    }
    
    // Check service health
    if (health.services?.database?.status === 'error') {
      this.sendAlert('critical', 'Database Connection Failed', 'Database is not responding');
    }
    
    if (health.services?.redis?.status === 'error') {
      this.sendAlert('medium', 'Redis Connection Failed', 'Redis is not responding');
    }
    
    // Check active alerts
    if (health.alerts?.critical > 0) {
      this.sendAlert('critical', 'Critical Alerts Active', `${health.alerts.critical} critical alerts`);
    }
    
    // Log performance metrics
    if (health.performance) {
      console.log(`📈 Performance: Avg ${health.performance.averageResponseTime?.toFixed(0)}ms | P95 ${health.performance.p95ResponseTime?.toFixed(0)}ms | Requests/min ${health.performance.requestsPerMinute?.toFixed(0)}`);
    }
    
    // Log top issues
    if (health.issues?.slowRoutes?.length > 0) {
      console.log(`🐌 Slow routes:`, health.issues.slowRoutes.slice(0, 3).map(r => `${r.route} (${r.avgTime?.toFixed(0)}ms)`));
    }
    
    if (health.issues?.errorRoutes?.length > 0) {
      console.log(`❌ Error routes:`, health.issues.errorRoutes.slice(0, 3).map(r => `${r.route} (${(r.errorRate * 100)?.toFixed(1)}%)`));
    }
  }

  sendAlert(severity, title, message) {
    const timestamp = new Date().toISOString();
    const emoji = this.getSeverityEmoji(severity);
    
    console.log(`${emoji} [${severity.toUpperCase()}] ${title}: ${message}`);
    
    // Here you would integrate with your alerting system
    // e.g., send to Slack, email, PagerDuty, etc.
    
    if (process.env.SLACK_WEBHOOK_URL) {
      this.sendSlackAlert(severity, title, message);
    }
  }

  async sendSlackAlert(severity, title, message) {
    try {
      const color = this.getSeverityColor(severity);
      
      const payload = {
        text: `Performance Alert: ${title}`,
        attachments: [
          {
            color,
            fields: [
              { title: 'Severity', value: severity, short: true },
              { title: 'Time', value: new Date().toISOString(), short: true },
              { title: 'Message', value: message, short: false },
              { title: 'Service', value: this.baseUrl, short: true }
            ]
          }
        ]
      };

      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error.message);
    }
  }

  getSeverityEmoji(severity) {
    switch (severity) {
      case 'low': return 'ℹ️';
      case 'medium': return '⚠️';
      case 'high': return '🚨';
      case 'critical': return '🔥';
      default: return '📢';
    }
  }

  getSeverityColor(severity) {
    switch (severity) {
      case 'low': return 'good';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      case 'critical': return '#ff0000';
      default: return '#cccccc';
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    console.log('🛑 Stopping performance monitoring...');
    this.isRunning = false;
  }
}

// Handle graceful shutdown
const monitor = new PerformanceMonitor();

process.on('SIGINT', () => {
  monitor.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  monitor.stop();
  process.exit(0);
});

// Start monitoring
monitor.start().catch(error => {
  console.error('Failed to start monitoring:', error);
  process.exit(1);
});