import { S } from '../../utils/account/styles'

export default function ProfileHeader({ username, goal, dietPreference }) {
  return (
    <div style={S.profileHeader}>
      <div style={S.avatarLarge}>
        {username?.[0]?.toUpperCase() || 'U'}
      </div>
      <div>
        <h2 style={S.profileName}>{username || 'User'}</h2>
        <p style={S.profileGoal}>
          {goal?.replace('_', ' ') || 'Goal not set'} •{' '}
          {dietPreference || 'Diet not set'}
        </p>
      </div>
    </div>
  )
}
