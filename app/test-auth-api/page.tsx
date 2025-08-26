'use client'

import { useState } from 'react'
import { loginAPI, logoutAPI, getSessionAPI } from '@lib/auth-api'

export default function TestAuthAPIPage() {
  const [email, setEmail] = useState('admin@npcl.com')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      const response = await loginAPI({ email, password })
      setResult(response)
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      const response = await logoutAPI()
      setResult(response)
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckSession = async () => {
    setLoading(true)
    try {
      const response = await getSessionAPI()
      setResult(response)
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Auth API</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter password"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Login'}
              </button>
              
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Logout'}
              </button>
              
              <button
                onClick={handleCheckSession}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Check Session'}
              </button>
            </div>
          </div>
          
          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Response:</h3>
              <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">API Endpoints</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Login:</strong> POST /api/auth/login</div>
            <div><strong>Logout:</strong> POST /api/auth/logout</div>
            <div><strong>Session:</strong> GET /api/auth/login</div>
          </div>
          
          <div className="mt-4">
            <h3 className="font-medium text-gray-900 mb-2">Direct API Test:</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <div>curl -X POST /api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@npcl.com","password":"your_password"}'</div>
              <div>curl -X POST /api/auth/logout</div>
              <div>curl -X GET /api/auth/login</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}