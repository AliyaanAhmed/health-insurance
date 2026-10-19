import { ageOf } from './health'
import type { Gender, Inquiry } from './health'

/** Proposed POC questionnaire. Sources and age-routing rationale: docs/HEALTH-KYC-QUESTIONS.md. */
export const KYC_VERSION = '2026-10-17-v1'
export type AnswerValue =
  'Yes' | 'No' | 'Not sure' | 'Never' | 'Former' | 'Current' | 'Not applicable'
export interface KycAnswerDraft {
  value: string
  details: string
}
export type AnswerMap = Record<string, KycAnswerDraft>
export interface KycDraft {
  household: AnswerMap
  members: Record<string, AnswerMap>
  authorized: boolean
}
export interface KycPerson {
  id: string
  fullName: string
  relationship: string
  dateOfBirth: string
  age: number
  gender: Gender
}
export interface KycQuestion {
  id: string
  label: string
  ar: string
  group: string
  groupAr: string
  minAge?: number
  maxAge?: number
  gender?: string
  options?: AnswerValue[]
  detailWhen?: string[]
  detailHint: string
  detailHintAr: string
  when?: { question: string; value: string }
}
export interface KycAnswer {
  questionId: string
  question: string
  questionAr: string
  answer: string
  details: string
}
export interface KycSubmission {
  version: typeof KYC_VERSION
  status: 'submitted'
  submittedAt: string
  authorized: true
  household: { answers: KycAnswer[] }
  members: (KycPerson & { answers: KycAnswer[] })[]
}
const health = { group: 'Health today', groupAr: 'الصحة اليوم' }
const ageSpecific = {
  group: 'A little more about this person',
  groupAr: 'معلومات إضافية عن هذا الشخص',
}
const describe = {
  detailHint: 'Tell us the condition, when it was diagnosed and any current treatment.',
  detailHintAr: 'اذكر الحالة وتاريخ تشخيصها وأي علاج حالي.',
}
export const SHARED_KYC_QUESTIONS: KycQuestion[] = [
  {
    id: 'family_history',
    label:
      'For anyone in this request, has a biological parent or sibling been diagnosed with diabetes, an inherited condition, or heart disease before age 60?',
    ar: 'هل شُخّص أحد الوالدين أو الإخوة البيولوجيين لأي شخص في هذا الطلب بالسكري أو مرض وراثي أو مرض قلبي قبل سن الستين؟',
    group: 'Family history — asked once',
    groupAr: 'التاريخ العائلي — يُسأل مرة واحدة',
    detailHint:
      'List each covered person affected by this family history, their relative and the condition. Spouses may have different family histories.',
    detailHintAr:
      'اذكر اسم كل شخص مشمول ينطبق عليه هذا التاريخ وقريبه والحالة. قد يختلف التاريخ العائلي للزوجين.',
  },
  {
    id: 'smoke_exposure',
    label: 'Is any child in this request regularly exposed to tobacco smoke or vaping at home?',
    ar: 'هل يتعرض أي طفل في هذا الطلب بانتظام لدخان التبغ أو التدخين الإلكتروني في المنزل؟',
    group: 'Home environment',
    groupAr: 'البيئة المنزلية',
    detailHint: 'Tell us which children are exposed and how often.',
    detailHintAr: 'اذكر الأطفال المعرضين لذلك ومدى تكرار التعرض.',
  },
]
export const MEMBER_KYC_QUESTIONS: KycQuestion[] = [
  {
    id: 'conditions',
    ...health,
    ...describe,
    label:
      'Has a doctor diagnosed an ongoing health condition, including diabetes, heart, kidney, cancer or mental-health conditions?',
    ar: 'هل شخّص الطبيب حالة صحية مستمرة، بما فيها السكري أو أمراض القلب أو الكلى أو السرطان أو الصحة النفسية؟',
  },
  {
    id: 'medicines',
    ...health,
    label: 'Does this person take prescribed medicine or receive regular treatment?',
    ar: 'هل يتناول هذا الشخص أدوية موصوفة أو يتلقى علاجاً منتظماً؟',
    detailHint: 'List the medicines or treatments and what they are for.',
    detailHintAr: 'اذكر الأدوية أو العلاجات وسبب استخدامها.',
  },
  {
    id: 'recent_care',
    ...health,
    label:
      'In the last 12 months, has this person had surgery, a hospital stay or specialist investigations, other than routine screening?',
    ar: 'خلال آخر 12 شهراً، هل خضع هذا الشخص لجراحة أو إقامة بالمستشفى أو فحوص متخصصة بخلاف الفحوص الروتينية؟',
    detailHint: 'Tell us the reason, approximate date and outcome.',
    detailHintAr: 'اذكر السبب والتاريخ التقريبي والنتيجة.',
  },
  {
    id: 'planned_care',
    ...health,
    label:
      'Are there symptoms awaiting assessment, pending test results, or treatment or surgery already advised?',
    ar: 'هل توجد أعراض تنتظر التقييم أو نتائج فحوص معلقة أو علاج أو جراحة أوصى بها الطبيب؟',
    detailHint: 'Describe what is pending and any planned appointments.',
    detailHintAr: 'صف ما هو معلق وأي مواعيد مخطط لها.',
  },
  {
    id: 'allergies',
    ...health,
    label: 'Does this person have allergies requiring prescribed medicine or emergency care?',
    ar: 'هل لدى هذا الشخص حساسية تتطلب أدوية موصوفة أو رعاية طارئة؟',
    detailHint: 'Tell us the trigger, reaction and treatment.',
    detailHintAr: 'اذكر المسبب ورد الفعل والعلاج.',
  },
  {
    id: 'birth',
    ...ageSpecific,
    ...describe,
    maxAge: 4,
    label:
      'Was this child born prematurely, or diagnosed with a condition present from birth that needs follow-up?',
    ar: 'هل وُلد هذا الطفل مبكراً أو شُخّص بحالة موجودة منذ الولادة تحتاج إلى متابعة؟',
  },
  {
    id: 'development',
    ...ageSpecific,
    maxAge: 17,
    label:
      'Has a clinician recommended support for growth, development, speech, hearing or learning?',
    ar: 'هل أوصى مختص بدعم النمو أو التطور أو النطق أو السمع أو التعلم؟',
    detailHint: 'Describe the support or therapy and whether it is ongoing.',
    detailHintAr: 'صف الدعم أو العلاج وما إذا كان مستمراً.',
  },
  {
    id: 'smoking',
    ...ageSpecific,
    minAge: 18,
    label: 'What is this person’s tobacco or nicotine use, including smoking, shisha and vaping?',
    ar: 'ما حالة استخدام هذا الشخص للتبغ أو النيكوتين، بما في ذلك السجائر والشيشة والتدخين الإلكتروني؟',
    options: ['Never', 'Former', 'Current'],
    detailWhen: ['Former', 'Current'],
    detailHint: 'Tell us the type, usual daily amount and when use started or stopped.',
    detailHintAr: 'اذكر النوع والكمية اليومية المعتادة ومتى بدأ أو توقف الاستخدام.',
  },
  {
    id: 'pregnancy',
    ...ageSpecific,
    minAge: 18,
    maxAge: 49,
    gender: 'female',
    label: 'Is this person currently pregnant?',
    ar: 'هل هذا الشخص حامل حالياً؟',
    options: ['Yes', 'No', 'Not applicable'],
    detailHint: 'Tell us the number of weeks or expected delivery date, if known.',
    detailHintAr: 'اذكر عدد الأسابيع أو موعد الولادة المتوقع إذا كان معروفاً.',
  },
  {
    id: 'pregnancy_complications',
    ...ageSpecific,
    ...describe,
    minAge: 18,
    maxAge: 49,
    gender: 'female',
    when: { question: 'pregnancy', value: 'Yes' },
    label: 'Has a clinician identified any complication in this pregnancy?',
    ar: 'هل حدد مختص أي مضاعفات في هذا الحمل؟',
  },
  {
    id: 'fertility',
    ...ageSpecific,
    minAge: 18,
    maxAge: 49,
    gender: 'female',
    when: { question: 'pregnancy', value: 'No' },
    label: 'Is this person currently receiving fertility treatment?',
    ar: 'هل يتلقى هذا الشخص حالياً علاجاً للخصوبة؟',
    detailHint: 'Describe the treatment and any planned procedures.',
    detailHintAr: 'صف العلاج وأي إجراءات مخطط لها.',
  },
  {
    id: 'prostate',
    ...ageSpecific,
    ...describe,
    minAge: 50,
    gender: 'male',
    label: 'Has a doctor diagnosed a prostate or urinary condition needing treatment or follow-up?',
    ar: 'هل شخّص الطبيب حالة بالبروستاتا أو الجهاز البولي تحتاج إلى علاج أو متابعة؟',
  },
  {
    id: 'daily_support',
    ...ageSpecific,
    minAge: 60,
    label:
      'Does this person need regular help with daily activities or use a mobility aid because of a health condition?',
    ar: 'هل يحتاج هذا الشخص إلى مساعدة منتظمة في الأنشطة اليومية أو أداة مساعدة على الحركة بسبب حالة صحية؟',
    detailHint: 'Tell us what support is needed and the underlying condition.',
    detailHintAr: 'اذكر الدعم المطلوب والحالة المسببة له.',
  },
]
export const choicesFor = (q: KycQuestion) => q.options ?? ['Yes', 'No', 'Not sure']
export const needsDetails = (q: KycQuestion, answer: string) =>
  (q.detailWhen ?? ['Yes']).includes(answer)
export function coveredPeople(record: Inquiry): KycPerson[] {
  const { draft } = record
  const people = [
    ...(draft.coverageTarget === 'dependents_only'
      ? []
      : [{ ...draft.applicant, id: 'applicant', relationship: 'Applicant' }]),
    ...(draft.coverageTarget === 'self'
      ? []
      : draft.members.map((m) => ({ ...m, relationship: m.relationship }))),
  ]
  return people.map((person) => {
    if (!person.fullName.trim() || !['male', 'female'].includes(person.gender))
      throw new Error(
        'A covered person has incomplete personal details. Please contact your advisor.',
      )
    const age = ageOf(person.dateOfBirth)
    if (age === null || age < 0)
      throw new Error('A covered person has an invalid date of birth. Please contact your advisor.')
    return {
      id: person.id,
      fullName: person.fullName,
      relationship: person.relationship,
      dateOfBirth: person.dateOfBirth,
      age,
      gender: person.gender,
    }
  })
}
export function sharedQuestions(people: KycPerson[]) {
  return SHARED_KYC_QUESTIONS.filter(
    (q) => q.id !== 'smoke_exposure' || people.some((p) => p.age < 18),
  )
}
export function memberQuestions(person: KycPerson, answers: AnswerMap): KycQuestion[] {
  return MEMBER_KYC_QUESTIONS.filter(
    (q) =>
      (q.minAge === undefined || person.age >= q.minAge) &&
      (q.maxAge === undefined || person.age <= q.maxAge) &&
      (!q.gender || person.gender === q.gender) &&
      (!q.when || answers[q.when.question]?.value === q.when.value),
  )
}
export function answerError(q: KycQuestion, answer?: KycAnswerDraft): string {
  if (!answer || !choicesFor(q).includes(answer.value as AnswerValue)) return 'Choose an answer.'
  if (needsDetails(q, answer.value) && answer.details.trim().length < 2)
    return 'Please add a little more detail.'
  if (answer.details.length > 2000) return 'Keep details within 2,000 characters.'
  return ''
}
export const emptyKycDraft = (): KycDraft => ({ household: {}, members: {}, authorized: false })
const snapshotAnswers = (questions: KycQuestion[], answers: AnswerMap): KycAnswer[] =>
  questions.map((q) => {
    const error = answerError(q, answers[q.id])
    if (error) throw new Error(error)
    return {
      questionId: q.id,
      question: q.label,
      questionAr: q.ar,
      answer: answers[q.id].value,
      details: needsDetails(q, answers[q.id].value) ? answers[q.id].details.trim() : '',
    }
  })
export function buildKycSubmission(record: Inquiry, draft: KycDraft): KycSubmission {
  const people = coveredPeople(record)
  if (!people.length) throw new Error('There are no insured people in this request.')
  if (!draft.authorized)
    throw new Error('Please confirm your authority and the accuracy of these answers.')
  return {
    version: KYC_VERSION,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    authorized: true,
    household: { answers: snapshotAnswers(sharedQuestions(people), draft.household) },
    members: people.map((person) => ({
      ...person,
      answers: snapshotAnswers(
        memberQuestions(person, draft.members[person.id] ?? {}),
        draft.members[person.id] ?? {},
      ),
    })),
  }
}
export function isKycSubmission(value: unknown): value is KycSubmission {
  if (!value || typeof value !== 'object') return false
  const data = value as KycSubmission
  const validAnswers = (list: unknown) =>
    Array.isArray(list) &&
    list.every(
      (a) =>
        a &&
        typeof a.questionId === 'string' &&
        typeof a.question === 'string' &&
        typeof a.answer === 'string' &&
        typeof a.details === 'string',
    )
  return (
    data.version === KYC_VERSION &&
    data.status === 'submitted' &&
    data.authorized === true &&
    typeof data.submittedAt === 'string' &&
    !!data.household &&
    validAnswers(data.household.answers) &&
    Array.isArray(data.members) &&
    data.members.length > 0 &&
    data.members.every(
      (m) =>
        m && typeof m.id === 'string' && typeof m.fullName === 'string' && validAnswers(m.answers),
    )
  )
}
export function formatKycText(data: KycSubmission): string {
  const lines = ['KYC Information', '', 'Family history and home environment']
  const append = (answers: KycAnswer[]) =>
    answers.forEach((a) => {
      lines.push(
        'Question: ' + a.question,
        'Answer: ' + a.answer,
        ...(a.details ? ['Details: ' + a.details] : []),
        '',
      )
    })
  append(data.household.answers)
  data.members.forEach((person) => {
    lines.push(
      'Member: ' + person.fullName,
      'Relationship: ' + person.relationship,
      'Age: ' + person.age,
      '',
    )
    append(person.answers)
  })
  lines.push(
    'Declaration: Authorized to provide these answers; information confirmed accurate.',
    'Submitted: ' + data.submittedAt,
  )
  return lines.join('\n')
}
export function appendKycEmail(existing: string, data: KycSubmission): string {
  const text = formatKycText(data)
  if (!/<(?:html|body|div|p|table|br|span)\b/i.test(existing))
    return existing + (existing ? '\n\n' : '') + text
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
    )
  const block =
    '<section data-insureai-kyc="v1"><h2>KYC Information</h2><div style="white-space:pre-wrap">' +
    escape(text.replace(/^KYC Information\n\n/, '')) +
    '</div></section>'
  return /<\/body>/i.test(existing)
    ? existing.replace(/<\/body>/i, block + '</body>')
    : existing + block
}
