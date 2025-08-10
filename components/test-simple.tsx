'use client'

import { useState } from 'react'

export function TestSimple() {
  const [count, setCount] = useState(0)
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🧪 Simple Test Component</h1>
      <p className="mb-4">If you can see this, the development server is working!</p>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-100 rounded">
          <p><strong>Current Count:</strong> {count}</p>
          <button 
            onClick={() => setCount(count + 1)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Increment Count
          </button>
        </div>
        
        <div className="p-4 bg-green-100 rounded">
          <p><strong>Test Button:</strong> Click this to test if JavaScript is working</p>
          <button 
            onClick={() => alert('JavaScript is working! 🎉')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test JavaScript
          </button>
        </div>
        
        <div className="p-4 bg-yellow-100 rounded">
          <p><strong>Console Test:</strong> Check your browser console (F12) for logs</p>
          <button 
            onClick={() => {
              console.log('Button clicked at:', new Date().toISOString())
              console.log('This proves the updated code is working!')
            }}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Log to Console
          </button>
        </div>
      </div>
    </div>
  )
} 