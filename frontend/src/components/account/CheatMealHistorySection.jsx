import { useEffect, useState } from 'react'
import API from '../../services/api'
import { S } from '../../utils/account/styles'

function formatDate(iso) {
  const date = new Date(iso)
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CheatMealHistorySection({ onLogNew }) {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/cheat-meals/history/')
      .then((res) => setMeals(res.data || []))
      .catch(() => setMeals([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div style={S.cheatHeader}>
        <h3 style={S.cheatHistoryTitle}>Cheat Meal History</h3>
        <button onClick={onLogNew} style={S.cheatLogBtn}>
          + Log New
        </button>
      </div>

      {loading && <p style={S.cheatLoadingText}>Loading history...</p>}

      {!loading && meals.length === 0 && (
        <div style={S.cheatEmptyWrap}>
          <p style={S.cheatEmptyEmoji}>🍕</p>
          <p style={S.modalDesc}>No cheat meals logged yet.</p>
        </div>
      )}

      {!loading && meals.length > 0 && (
        <div style={S.cheatList}>
          {meals.map((meal) => (
            <div key={meal.id} style={S.cheatCard}>
              <div style={S.cheatCardTop}>
                <div style={S.cheatCardLeft}>
                  <p style={S.cheatCardFood}>{meal.food_name || 'Unknown food'}</p>
                  <p style={S.cheatCardMeta}>
                    {formatDate(meal.logged_at)} • {meal.entry_method === 'image' ? '📸 Photo' : '✍️ Manual'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={S.cheatCardCalories}>
                    {meal.user_edited_calories != null
                      ? `${Math.round(meal.user_edited_calories)} kcal`
                      : meal.ai_estimated_calories != null
                        ? `${Math.round(meal.ai_estimated_calories)} kcal`
                        : 'Pending estimate'}
                  </p>
                  {meal.ai_confidence && (
                    <p style={S.cheatCardConfidence}>
                      {meal.ai_confidence > 0.7 ? '🎯 High'
                        : meal.ai_confidence > 0.4 ? '📊 Medium' : '⚠️ Low'} conf.
                    </p>
                  )}
                </div>
              </div>
              {meal.notes && (
                <p style={S.cheatCardNotes}>
                  "{meal.notes}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
