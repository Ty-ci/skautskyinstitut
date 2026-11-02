import Link from 'next/link'

const NotFound = () => {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-8">
      <h1 className="text-3xl font-bold">Stránka sa nenašla</h1>
      <Link href="/" className="hover:underline">
        ← Späť na podujatia
      </Link>
    </div>
  )
}

export default NotFound
