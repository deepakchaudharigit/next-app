/**
 * LoginForm Component Tests
 * Tests user interactions, validation, and form submission
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/LoginForm'

describe('LoginForm Component', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all form elements', () => {
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={false} />)

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={false} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const form = emailInput.closest('form')!

    await user.type(emailInput, 'invalid-email')
    
    await act(async () => {
      fireEvent.submit(form)
    })

    await waitFor(() => {
      expect(screen.getByText(/email is invalid/i)).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should validate password length', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={false} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, '123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={false} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('should clear validation errors when user starts typing', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={false} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const form = emailInput.closest('form')!

    // Trigger validation error
    await user.type(emailInput, 'invalid')
    
    await act(async () => {
      fireEvent.submit(form)
    })

    await waitFor(() => {
      expect(screen.getByText(/email is invalid/i)).toBeInTheDocument()
    })

    // Clear input and type valid email
    await user.clear(emailInput)
    await user.type(emailInput, 'test@example.com')

    await waitFor(() => {
      expect(screen.queryByText(/email is invalid/i)).not.toBeInTheDocument()
    })
  })

  it('should disable form when loading', () => {
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={true} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /signing in/i })

    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
  })

  it('should show loading spinner when submitting', () => {
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={true} />)

    const loadingSpinner = screen.getByRole('button', { name: /signing in/i })
    expect(loadingSpinner).toBeInTheDocument()
    expect(loadingSpinner.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('should handle form submission with Enter key', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={false} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('should have proper accessibility attributes', () => {
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={false} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('autoComplete', 'email')
    expect(emailInput).toHaveAttribute('required')

    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
    expect(passwordInput).toHaveAttribute('required')
  })

  it('should apply error styling to invalid fields', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={mockOnSubmit} isLoading={false} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const form = emailInput.closest('form')!

    await user.type(emailInput, 'invalid-email')
    
    await act(async () => {
      fireEvent.submit(form)
    })

    await waitFor(() => {
      expect(emailInput).toHaveClass('border-red-300')
    })
  })
})