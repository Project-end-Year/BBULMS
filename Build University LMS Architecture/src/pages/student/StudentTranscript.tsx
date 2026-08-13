import { GraduationCap, TrendingUp } from 'lucide-react'
import { User, grades, courseOfferings, courses, semesters, enrollments, programs } from '../../lib/mock'

interface Props { user: User }

const gradeColor = (letter: string) => {
  if (letter.startsWith('A')) return 'text-emerald-700 bg-emerald-50'
  if (letter.startsWith('B')) return 'text-blue-700 bg-blue-50'
  if (letter.startsWith('C')) return 'text-amber-700 bg-amber-50'
  return 'text-red-700 bg-red-50'
}

export default function StudentTranscript({ user }: Props) {
  const myGrades = grades.filter((g) => g.studentId === user.id)
  const prog = user.programId ? programs.find((p) => p.id === user.programId) : null

  // Group by semester
  interface SemesterRecord {
    semester: typeof semesters[0]
    rows: { course: typeof courses[0]; offering: typeof courseOfferings[0]; grade: typeof grades[0] }[]
    gpa: number
    credits: number
  }

  const semesterRecords: SemesterRecord[] = semesters
    .filter((s) => !s.isCurrent)
    .map((sem) => {
      const semOfferings = courseOfferings.filter((o) => o.semesterId === sem.id)
      const rows = myGrades
        .filter((g) => semOfferings.some((o) => o.id === g.courseOfferingId))
        .map((g) => {
          const offering = semOfferings.find((o) => o.id === g.courseOfferingId)!
          const course = courses.find((c) => c.id === offering.courseId)!
          return { course, offering, grade: g }
        })
        .filter((r) => r.course)
      const totalPts = rows.reduce((s, r) => s + r.grade.gradePoints * r.course.creditHours, 0)
      const totalCr = rows.reduce((s, r) => s + r.course.creditHours, 0)
      return { semester: sem, rows, gpa: totalCr > 0 ? totalPts / totalCr : 0, credits: totalCr }
    })
    .filter((s) => s.rows.length > 0)
    .reverse()

  // Current semester — in progress
  const currentSem = semesters.find((s) => s.isCurrent)!
  const currentEnrollments = enrollments.filter((e) => e.studentId === user.id && e.status === 'active')
  const currentOfferings = courseOfferings.filter((o) => currentEnrollments.some((e) => e.courseOfferingId === o.id))

  // Cumulative GPA
  let totalPoints = 0, totalCredits = 0
  for (const { grade, course } of semesterRecords.flatMap((s) => s.rows)) {
    totalPoints += grade.gradePoints * course.creditHours
    totalCredits += course.creditHours
  }
  const cumulativeGPA = totalCredits > 0 ? (totalPoints / totalCredits) : 0

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-blue-900 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap size={18} className="text-blue-300" />
              <span className="text-blue-300 text-sm font-medium">Official Academic Transcript</span>
            </div>
            <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
            <p className="text-blue-300 text-sm mt-1">{user.email}</p>
            {prog && <p className="text-blue-200 text-sm mt-0.5">{prog.name} · {prog.degreeLevel.charAt(0).toUpperCase() + prog.degreeLevel.slice(1)}</p>}
          </div>
          <div className="text-right">
            <div className={`text-5xl font-black ${cumulativeGPA >= 3.5 ? 'text-emerald-400' : cumulativeGPA >= 3.0 ? 'text-blue-300' : 'text-amber-400'}`}>
              {cumulativeGPA > 0 ? cumulativeGPA.toFixed(2) : '—'}
            </div>
            <div className="text-blue-300 text-sm mt-1">Cumulative GPA</div>
            <div className="flex items-center gap-3 mt-3 text-sm">
              <div className="text-center">
                <div className="font-bold text-white">{totalCredits}</div>
                <div className="text-blue-400 text-xs">Credits</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-white">{semesterRecords.length}</div>
                <div className="text-blue-400 text-xs">Semesters</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current semester (in progress) */}
      {currentOfferings.length > 0 && (
        <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
          <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{currentSem.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{currentSem.startDate} – {currentSem.endDate}</p>
            </div>
            <span className="bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-full">In Progress</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Credits</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Grade</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentOfferings.map((offering) => {
                const course = courses.find((c) => c.id === offering.courseId)!
                return (
                  <tr key={offering.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{course.title}</div>
                      <div className="text-xs text-slate-400">{course.code}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{course.creditHours}</td>
                    <td className="px-5 py-3"><span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">In Progress</span></td>
                    <td className="px-5 py-3 text-slate-400">—</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Historical semesters */}
      {semesterRecords.map((rec) => (
        <div key={rec.semester.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{rec.semester.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{rec.semester.startDate} – {rec.semester.endDate}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-900">{rec.gpa.toFixed(2)}</div>
              <div className="text-xs text-slate-400">Semester GPA · {rec.credits} credits</div>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Credits</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Grade</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rec.rows.map(({ course, grade, offering }) => (
                <tr key={offering.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">{course.title}</div>
                    <div className="text-xs text-slate-400">{course.code}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{course.creditHours}</td>
                  <td className="px-5 py-3 text-slate-700 font-mono">{grade.finalScore.toFixed(1)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${gradeColor(grade.letterGrade)}`}>{grade.letterGrade}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-700 font-mono">{grade.gradePoints.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td className="px-5 py-3 font-semibold text-slate-700" colSpan={2}>Semester Total</td>
                <td className="px-5 py-3" colSpan={2}></td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-blue-600" />
                    <span className="font-bold text-slate-900">{rec.gpa.toFixed(2)} GPA</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ))}

      {semesterRecords.length === 0 && currentOfferings.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          No academic records found.
        </div>
      )}

      {/* Grade scale legend */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Grade Scale</h4>
        <div className="flex flex-wrap gap-2">
          {[['A', '4.0', '≥93'], ['A−', '3.7', '≥90'], ['B+', '3.3', '≥87'], ['B', '3.0', '≥83'], ['B−', '2.7', '≥80'], ['C+', '2.3', '≥77'], ['C', '2.0', '≥73'], ['C−', '1.7', '≥70'], ['D+', '1.3', '≥67'], ['D', '1.0', '≥60'], ['F', '0.0', '<60']].map(([g, pts, range]) => (
            <div key={g} className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5">
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${gradeColor(g)}`}>{g}</span>
              <span className="text-xs text-slate-500 font-mono">{pts}</span>
              <span className="text-xs text-slate-400">{range}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
