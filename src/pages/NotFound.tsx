import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { EmptyState } from '../components/ui'

export default function NotFound() {
  return (
    <div className="card">
      <EmptyState icon={SearchX} title="Page not found" text="The page you're looking for doesn't exist."
        action={<Link to="/" className="btn-primary">Back to dashboard</Link>} />
    </div>
  )
}
