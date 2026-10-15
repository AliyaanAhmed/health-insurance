import { CaretDown, ShieldCheck, Users } from '@phosphor-icons/react'
import type { Draft, Person, Relationship } from './health'
import { ageOf, displayDate } from './health'
import { useLanguage } from './language-context'
import { Avatar } from './ui'

type TreePerson = Person & { id: string; relationship?: Relationship }
function PersonNode({
  person,
  label,
  included = true,
}: {
  person: TreePerson
  label: string
  included?: boolean
}) {
  const { t, locale } = useLanguage()
  return (
    <article className={`family-tree-person ${included ? '' : 'tree-sponsor'}`}>
      <div className="tree-person-identity">
        <Avatar person={person} relationship={person.relationship} />
        <div>
          <span className="tree-person-role">{t(label)}</span>
          <h3>{person.fullName}</h3>
        </div>
      </div>
      <dl className="tree-person-details">
        <div>
          <dt>{t('Date of birth')}</dt>
          <dd>{displayDate(person.dateOfBirth, locale)}</dd>
        </div>
        <div>
          <dt>{t('Age')}</dt>
          <dd>
            {ageOf(person.dateOfBirth) ?? '-'} {t('years old')}
          </dd>
        </div>
        <div>
          <dt>{t('Gender')}</dt>
          <dd>{t(person.gender === 'female' ? 'Female' : 'Male')}</dd>
        </div>
      </dl>
      <span className={`tree-inclusion ${included ? '' : 'excluded'}`}>
        <ShieldCheck size={13} />
        {t(included ? 'Included in cover' : 'Not included in cover')}
      </span>
    </article>
  )
}
export function FamilyTree({ draft }: { draft: Draft }) {
  const { t } = useLanguage()
  const sponsor = draft.coverageTarget === 'dependents_only'
  const groups: { relationship: Relationship; label: string }[] = [
    { relationship: 'spouse', label: 'Spouse' },
    { relationship: 'child', label: 'Children' },
    { relationship: 'parent', label: 'Parents' },
    { relationship: 'other', label: 'Other dependents' },
  ]
  const populated = groups
    .map((group) => ({
      ...group,
      members: draft.members.filter((member) => member.relationship === group.relationship),
    }))
    .filter((group) => group.members.length)
  return (
    <div className="family-tree" aria-label={t('Family cover structure')}>
      <div className="family-tree-root">
        <PersonNode
          person={{ ...draft.applicant, id: 'applicant' }}
          label={sponsor ? 'Sponsor' : 'Primary applicant'}
          included={!sponsor}
        />
      </div>
      {!!populated.length && (
        <ul className="family-tree-branches">
          {populated.map((group) => (
            <li className="family-tree-branch" key={group.relationship}>
              <details className="tree-relationship-group" open>
                <summary>
                  <span>
                    <Users size={17} />
                    {t(group.label)}
                    <small>{group.members.length}</small>
                  </span>
                  <CaretDown size={15} />
                </summary>
                <ul className="tree-member-grid">
                  {group.members.map((person) => (
                    <li key={person.id}>
                      <PersonNode
                        person={person}
                        label={
                          group.label === 'Children'
                            ? 'Child'
                            : group.label === 'Parents'
                              ? 'Parent'
                              : group.label === 'Other dependents'
                                ? 'Other dependant'
                                : group.label
                        }
                      />
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
