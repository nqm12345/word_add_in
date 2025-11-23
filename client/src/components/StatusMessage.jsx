import { CheckCircle, XCircle, Info } from 'lucide-react'

export default function StatusMessage({ message, type }) {
  const styles = {
    success: 'bg-green-100 border-green-500 text-green-800',
    error: 'bg-red-100 border-red-500 text-red-800',
    info: 'bg-blue-100 border-blue-500 text-blue-800'
  }

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  }

  return (
    <div className={`border-l-4 p-4 mb-6 rounded-r-lg ${styles[type]} flex items-center space-x-3`}>
      {icons[type]}
      <span className="font-medium">{message}</span>
    </div>
  )
}
