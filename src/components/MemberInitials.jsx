import { initials } from '../lib/format'

// Horizontal row of member initial bubbles.
export default function MemberInitials({ members }) {
  if (!members?.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {members.map((member) => (
        <div
          key={member.id}
          title={member.name}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chip text-sm font-bold text-text"
        >
          {initials(member.name)}
        </div>
      ))}
    </div>
  )
}
