import { useState } from 'react'
import { Save, CheckCircle } from 'lucide-react'
import { User, courseOfferings, courses, semesters, enrollments, grades as initialGrades, users, Grade, scoreToLetterGrade } from '../../lib/mock'

interface Props { user: User }

export default function ProfessorGrades({ user }: Props) {
  const [grades, setGrades] = useState<Grade[]>(initialGrades)
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const currentSem = semesters.find((s) => s.isCurrent)!
  const myOfferings = courseOfferings.filter((o) => o.professorId === user.id && o.semesterId === currentSem.id)
  const [selectedOfferingId, setSelectedOfferingId] = useState(myOfferings[0]?.id ?? 0)
  const [scores, setScores] = useState<Record<number, string>>({})

  const selectedOffering = myOfferings.find((o) => o.id === selectedOfferingId)
  const course = selectedOffering ? courses.find((c) => c.id === selectedOffering.courseId) : null
  const enrolledStudents = enrollments
    .filter((e) => e.courseOfferingId === selectedOfferingId && e.status === 'active')
    .map((e) => users.find((u) => u.id === e.studentId)!)
    .filter(Boolean)

  const getGrade = (studentId: number) => grades.find((g) => g.studentId === studentId && g.courseOfferingId === selectedOfferingId)

  const handleScoreChange = (studentId: number, val: string) => {
    setScores((prev) => ({ ...prev, [studentId]: val }))
    setSavedIds((prev) => { const s = new Set(prev); s.delete(studentId); return s })
  }

  const saveGrade = (studentId: number) => {
    const raw = scores[studentId]
    if (raw === undefined || raw === '') return
    const score = Math.max(0, Math.min(100, parseFloat(raw)))
    const { letter, points } = scoreToLetterGrade(score)
    const existing = getGrade(studentId)
    if (existing) {
      setGrades((prev) => prev.map((g) => g.studentId === studentId && g.courseOfferingId === selectedOfferingId ? { ...g, finalScore: score, letterGrade: letter, gradePoints: points } : g))
    } else {
      setGrades((prev) => [...prev, { id: Date.now(), studentId, courseOfferingId: selectedOfferingId, finalScore: score, letterGrade: letter, gradePoints: points }])
    }
    setSavedIds((prev) => new Set(prev).add(studentId))
  }

  const gradeColor = (letter: string) => {
    if (letter.startsWith('A')) return 'text-emerald-700 bg-emerald-50'
    if (letter.startsWith('B')) return 'text-blue-700 bg-blue-50'
    if (letter.startsWith('C')) return 'text-amber-700 bg-amber-50'
    return 'text-red-700 bg-red-50'
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-slate-900">Grade Entry</h2>
        <p className="text-sm text-slate-500">Enter final scores — letter grades are computed automatically</p>
      </div>

      {/* Course selector */}
      <div className="flex gap-2 flex-wrap">
        {myOfferings.map((o) => {
          const c = courses.find((c) => c.id === o.courseId)!
          return (
            <button
              key={o.id}
              onClick={() => { setSelectedOfferingId(o.id); setScores({}) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedOfferingId === o.id ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {c.code} §{o.section}
            </button>
          )
        })}
      </div>

      {selectedOffering && course && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{course.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{course.code} · Section {selectedOffering.section} · {enrolledStudents.length} students</p>
            </div>
            <div className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium">
              {grades.filter((g) => g.courseOfferingId === selectedOfferingId).length} / {enrolledStudents.length} graded
            </div>
          </div>

          {/* Grade scale reference */}
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex gap-3 flex-wrap text-xs text-slate-500">
            <span className="font-medium text-slate-600">Grade scale:</span>
            {[['A', '≥93'], ['A-', '≥90'], ['B+', '≥87'], ['B', '≥83'], ['B-', '≥80'], ['C+', '≥77'], ['C', '≥73'], ['D', '≥60'], ['F', '<60']].map(([g, r]) => (
              <span key={g} className="font-mono">{g} <span className="text-slate-400">{r}</span></span>
            ))}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Final Score (/100)</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Letter Grade</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Grade Points</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Save</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrolledStudents.map((student) => {
                const existingGrade = getGrade(student.id)
                const inputVal = scores[student.id] ?? (existingGrade ? String(existingGrade.finalScore) : '')
                const previewScore = inputVal !== '' ? Math.max(0, Math.min(100, parseFloat(inputVal) || 0)) : null
                const preview = previewScore !== null ? scoreToLetterGrade(previewScore) : null
                const displayGrade: { letter: string; points: number } | null =
                  existingGrade && scores[student.id] === undefined
                    ? { letter: existingGrade.letterGrade, points: existingGrade.gradePoints }
                    : preview ? { letter: preview.letter, points: preview.points } : null
                const isSaved = savedIds.has(student.id)
                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{student.firstName} {student.lastName}</div>
                          <div className="text-xs text-slate-400">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={inputVal}
                        onChange={(e) => handleScoreChange(student.id, e.target.value)}
                        placeholder="—"
                        className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </td>
                    <td className="px-5 py-3">
                      {displayGrade && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${gradeColor(displayGrade.letter)}`}>
                          {displayGrade.letter}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 font-mono text-sm">
                      {displayGrade ? displayGrade.points.toFixed(1) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isSaved ? (
                        <span className="flex items-center justify-end gap-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle size={14} /> Saved
                        </span>
                      ) : (
                        <button
                          onClick={() => saveGrade(student.id)}
                          disabled={!inputVal}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-medium rounded-lg transition-colors ml-auto"
                        >
                          <Save size={13} /> Save
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {enrolledStudents.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No students enrolled in this course offering.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
