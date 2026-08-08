import { MessageSquare } from 'lucide-react'

function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      <div className="w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-bbu-blue" />
          <h2 className="font-semibold text-text">Conversations</h2>
        </div>
        <p className="text-sm text-text-muted">Chat list will be populated in Step 31+.</p>
      </div>

      <div className="flex-1 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-text-muted">Select a conversation to start messaging.</p>
      </div>
    </div>
  )
}

export default ChatPage
