/** Realça "Tech" no fim do nome da marca, como no logótipo original. */
export function BrandName({ name }: { name: string }) {
  const match = /^(.*?)(tech)$/i.exec(name)
  if (!match) return <>{name}</>
  return (
    <>
      {match[1]}
      <span className="text-primary">{match[2]}</span>
    </>
  )
}
