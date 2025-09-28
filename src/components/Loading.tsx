import React from 'react'

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-b-4 border-gray-200 mb-6"></div>
      <p className="text-lg font-semibold text-muted-foreground">Loading, please wait...</p>
    </div>
  )
}

export default Loading