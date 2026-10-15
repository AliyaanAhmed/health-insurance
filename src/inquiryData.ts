import { createDraft } from './health'
import type { CoverageTarget, Inquiry, Member } from './health'

const member = (
  id: string,
  relationship: Member['relationship'],
  fullName: string,
  dateOfBirth: string,
  gender: Member['gender'],
): Member => ({ id, relationship, fullName, dateOfBirth, gender, saved: true })

export function sampleInquiries(): Inquiry[] {
  const fixtures: {
    id: string
    name: string
    gender: 'male' | 'female'
    dob: string
    target: CoverageTarget
    emirate: string
    nationality: string
    date: string
    status: Inquiry['status']
    members: Member[]
  }[] = [
    {
      id: 'HI-2026-1042',
      name: 'Mohammed Al Mansoori',
      gender: 'male',
      dob: '1992-04-18',
      target: 'self_and_dependents',
      emirate: 'Dubai',
      nationality: 'AE',
      date: '2026-10-15T06:15:00Z',
      status: 'reviewing',
      members: [
        member('sara', 'spouse', 'Fatima Al Mansoori', '1995-08-12', 'female'),
        member('adam', 'child', 'Hamdan Al Mansoori', '2018-05-08', 'male'),
      ],
    },
    {
      id: 'HI-2026-1041',
      name: 'Aisha Al Mazrouei',
      gender: 'female',
      dob: '1997-11-24',
      target: 'self',
      emirate: 'Abu Dhabi',
      nationality: 'AE',
      date: '2026-10-14T10:30:00Z',
      status: 'ready',
      members: [],
    },
    {
      id: 'HI-2026-1040',
      name: 'Khalid Al Nuaimi',
      gender: 'male',
      dob: '1988-03-10',
      target: 'dependents_only',
      emirate: 'Sharjah',
      nationality: 'AE',
      date: '2026-10-14T05:45:00Z',
      status: 'received',
      members: [
        member('raj', 'parent', 'Abdulla Al Nuaimi', '1961-09-21', 'male'),
        member('meena', 'parent', 'Mariam Al Nuaimi', '1965-01-15', 'female'),
      ],
    },
    {
      id: 'HI-2026-1039',
      name: 'Maryam Al Qasimi',
      gender: 'female',
      dob: '1990-07-09',
      target: 'self_and_dependents',
      emirate: 'Dubai',
      nationality: 'AE',
      date: '2026-10-13T08:20:00Z',
      status: 'reviewing',
      members: [
        member('nour', 'child', 'Alia Al Qasimi', '2016-06-17', 'female'),
        member('yusuf', 'child', 'Sultan Al Qasimi', '2020-02-04', 'male'),
      ],
    },
    {
      id: 'HI-2026-1038',
      name: 'Abdulla Al Shamsi',
      gender: 'male',
      dob: '1994-12-03',
      target: 'self',
      emirate: 'Ajman',
      nationality: 'AE',
      date: '2026-10-12T12:10:00Z',
      status: 'received',
      members: [],
    },
    {
      id: 'HI-2026-1037',
      name: 'Saeed Al Ketbi',
      gender: 'male',
      dob: '1986-05-22',
      target: 'dependents_only',
      emirate: 'Ras Al Khaimah',
      nationality: 'AE',
      date: '2026-10-11T07:00:00Z',
      status: 'ready',
      members: [
        member('mariam', 'spouse', 'Hessa Al Ketbi', '1989-10-14', 'female'),
        member('zara', 'child', 'Shamma Al Ketbi', '2019-03-26', 'female'),
      ],
    },
  ]
  return fixtures.map((item, index) => ({
    id: item.id,
    sample: true,
    status: item.status,
    createdAt: item.date,
    premium: {
      base: [4200, 1850, 9600, 5400, 1250, 3800][index],
      additional: [350, 0, 600, 250, 0, 200][index],
      taxPercent: 5,
    },
    documents: [
      {
        id: item.id + '-applicant',
        name: 'Applicant-Details.pdf',
        category: 'applicant' as const,
        sample: true,
      },
      { id: item.id + '-visa', name: 'Visa-Details.pdf', category: 'visa' as const, sample: true },
      ...(item.members.length
        ? [
            {
              id: item.id + '-family',
              name: 'Family-Cover-Summary.pdf',
              category: 'family' as const,
              sample: true,
            },
          ]
        : []),
    ],
    draft: {
      ...createDraft(item.target),
      visaType: index === 2 ? 'investor' : 'employee',
      nationalityCode: item.nationality,
      visaEmirate: item.emirate,
      visaStatus: index === 4 ? 'new' : 'renewal',
      applicant: {
        fullName: item.name,
        gender: item.gender,
        dateOfBirth: item.dob,
        maritalStatus: item.target === 'self' ? 'Single' : 'Married',
        salaryBand: index === 4 ? 'below_4000' : 'above_4000',
        email: item.name.toLowerCase().replace(/\s+/g, '.') + '@example.com',
        mobile: `50100010${index}`,
      },
      members: item.members,
    },
  }))
}

export function inquiryStatus(record: Inquiry) {
  return record.status === 'reviewing'
    ? 'In review'
    : record.status === 'ready'
      ? 'Ready for review'
      : record.status === 'received'
        ? 'Details received'
        : 'Prepared in this session'
}
export function insuredCount(record: Inquiry) {
  return record.draft.members.length + (record.draft.coverageTarget === 'dependents_only' ? 0 : 1)
}
export function recordDate(value: string, locale: string, withTime = false) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-AE' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? ({ hour: '2-digit', minute: '2-digit' } as const) : {}),
    timeZone: 'Asia/Karachi',
  }).format(new Date(value))
}

export function inquiryName(record: Inquiry, prefix = 'Inquiry for Health Insurance') {
  return prefix + ' - ' + record.draft.applicant.email
}
