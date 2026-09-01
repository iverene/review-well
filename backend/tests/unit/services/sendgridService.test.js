import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verificationTemplate, welcomeTemplate, notificationTemplate } from '../../../services/templates/email/index.js'

describe('Email Templates', () => {
  describe('verificationTemplate', () => {
    it('should contain verification URL', () => {
      const template = verificationTemplate('John', 'http://example.com/verify?token=abc123')
      expect(template).toContain('http://example.com/verify?token=abc123')
    })

    it('should contain display name', () => {
      const template = verificationTemplate('John', 'http://example.com/verify')
      expect(template).toContain('John')
    })

    it('should handle missing display name', () => {
      const template = verificationTemplate(null, 'http://example.com/verify')
      expect(template).toContain('there')
    })
  })

  describe('welcomeTemplate', () => {
    it('should contain welcome message', () => {
      const template = welcomeTemplate('John')
      expect(template).toContain('Welcome to Review Well')
    })

    it('should contain display name', () => {
      const template = welcomeTemplate('John')
      expect(template).toContain('John')
    })
  })

  describe('notificationTemplate', () => {
    it('should create like notification', () => {
      const template = notificationTemplate('like', 'John', 'Math Study Guide')
      expect(template).toContain('liked your reviewer')
      expect(template).toContain('John')
      expect(template).toContain('Math Study Guide')
    })

    it('should create follow notification', () => {
      const template = notificationTemplate('follow', 'John')
      expect(template).toContain('started following you')
      expect(template).toContain('John')
    })
  })
})
